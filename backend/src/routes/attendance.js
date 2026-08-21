const express = require('express');
const router = express.Router();
const db = require('../db');

// Check if a record exists for a student on a given date
const checkExisting = db.prepare(
  'SELECT id, status FROM attendance_record WHERE student_id = ? AND date = ?'
);

// Mark attendance (upsert: replace existing record for same student+date)
router.post('/', (req, res) => {
  const { date, records } = req.body;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required' });
  }
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Records array is required' });
  }

  const checkStudent = db.prepare('SELECT id FROM student WHERE id = ?');
  const upsertAttendance = db.prepare(
    'INSERT INTO attendance_record (student_id, date, status, time, end_time, scheduled_class_id, replacement_for_id) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status, time = excluded.time, end_time = excluded.end_time, scheduled_class_id = COALESCE(excluded.scheduled_class_id, scheduled_class_id), replacement_for_id = COALESCE(excluded.replacement_for_id, replacement_for_id), replacement_date = CASE WHEN excluded.status = \'present\' THEN NULL ELSE replacement_date END'
  );
  const addCredit = db.prepare('UPDATE student SET credits = credits + 1 WHERE id = ?');
  const removeCredit = db.prepare('UPDATE student SET credits = MAX(0, credits - 1) WHERE id = ?');

  const transaction = db.transaction(() => {
    let created = 0;
    let updated = 0;
    for (const record of records) {
      const { student_id, status, time, end_time, scheduled_class_id, replacement_for_id } = record;
      if (!student_id || !status || !['present', 'absent'].includes(status)) {
        throw new Error('Invalid record: student_id=' + student_id + ', status=' + status);
      }
      const student = checkStudent.get(student_id);
      if (!student) {
        throw new Error('Student not found: ' + student_id);
      }

      const existing = checkExisting.get(student_id, date);

      if (existing) {
        // Changing absent -> present: remove credit
        if (existing.status === 'absent' && status === 'present') {
          removeCredit.run(student_id);
        }
        // Changing present -> absent: add credit
        if (existing.status === 'present' && status === 'absent') {
          addCredit.run(student_id);
        }
        upsertAttendance.run(student_id, date, status, time || null, end_time || null, scheduled_class_id || null, replacement_for_id || null);
        updated++;
      } else {
        upsertAttendance.run(student_id, date, status, time || null, end_time || null, scheduled_class_id || null, replacement_for_id || null);
        if (status === 'absent') {
          addCredit.run(student_id);
        }
        created++;
      }
    }
    return { created, updated };
  });

  try {
    const result = transaction();
    const msg = [];
    if (result.created > 0) msg.push(result.created + ' created');
    if (result.updated > 0) msg.push(result.updated + ' updated');
    res.status(200).json({ message: msg.join(', '), ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get attendance history for a student
router.get('/student/:studentId', (req, res) => {
  const student = db.prepare('SELECT id FROM student WHERE id = ?').get(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const records = db.prepare(
    'SELECT * FROM attendance_record WHERE student_id = ? ORDER BY date DESC, created_at DESC'
  ).all(req.params.studentId);
  res.json(records);
});

// Get attendance records for a specific date
router.get("/date/:dateStr", function(req, res) {
  var records = db.prepare(
    "SELECT ar.*, s.name as student_name FROM attendance_record ar JOIN student s ON s.id = ar.student_id WHERE ar.date = ? ORDER BY ar.time"
  ).all(req.params.dateStr);
  res.json(records);
});

// Get today's attendance records with student name and time for timeline
router.get('/today', (req, res) => {
  var today = new Date().toISOString().slice(0, 10);
  var records = db.prepare(
    "SELECT ar.*, s.name as student_name FROM attendance_record ar JOIN student s ON s.id = ar.student_id WHERE ar.date = ? ORDER BY ar.time"
  ).all(today);
  res.json(records);
});

// Get dates that have attendance records (for calendar highlighting)
router.get('/dates', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates required' });
  const dates = db.prepare(
    'SELECT DISTINCT date FROM (SELECT date FROM attendance_record WHERE date >= ? AND date <= ? UNION ALL SELECT date FROM scheduled_class WHERE date >= ? AND date <= ?) ORDER BY date'
  ).all(from, to, from, to);
  res.json(dates.map(function(d) { return d.date; }));
});

// Edit a single attendance record (change status)
router.patch('/:id', (req, res) => {
  const { status, time, end_time } = req.body;
  if (!status || !['present', 'absent'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "present" or "absent"' });
  }

  const record = db.prepare('SELECT * FROM attendance_record WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Attendance record not found' });

  if (record.status === status) {
    return res.json(db.prepare('SELECT * FROM attendance_record WHERE id = ?').get(req.params.id));
  }

  const addCredit = db.prepare('UPDATE student SET credits = credits + 1 WHERE id = ?');
  const removeCredit = db.prepare('UPDATE student SET credits = MAX(0, credits - 1) WHERE id = ?');

  const transaction = db.transaction(() => {
    if (record.status === 'absent' && status === 'present') {
      removeCredit.run(record.student_id);
      db.prepare('UPDATE attendance_record SET status = ?, time = ?, end_time = ?, replacement_date = NULL WHERE id = ?').run(status, time || null, end_time || null, req.params.id);
    }
    if (record.status === 'present' && status === 'absent') {
      addCredit.run(record.student_id);
      db.prepare('UPDATE attendance_record SET status = ?, time = ?, end_time = ? WHERE id = ?').run(status, time || null, end_time || null, req.params.id);
    }
  });

  transaction();

  const updated = db.prepare('SELECT * FROM attendance_record WHERE id = ?').get(req.params.id);
  const student = db.prepare('SELECT credits FROM student WHERE id = ?').get(record.student_id);
  res.json({ attendance: updated, credits: student.credits });
});

// Delete a single attendance record (removes credit if absent)
router.delete('/:id', (req, res) => {
  const record = db.prepare('SELECT * FROM attendance_record WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Attendance record not found' });

  const removeCredit = db.prepare('UPDATE student SET credits = MAX(0, credits - 1) WHERE id = ?');

  const transaction = db.transaction(() => {
    if (record.status === 'absent') {
      removeCredit.run(record.student_id);
    }
    db.prepare('DELETE FROM attendance_record WHERE id = ?').run(req.params.id);
  });

  transaction();

  const student = db.prepare('SELECT credits FROM student WHERE id = ?').get(record.student_id);
  res.json({ message: 'Attendance record deleted', credits: student.credits });
});

// Set replacement class
router.post('/replacement', (req, res) => {
  const { student_id, attendance_id, replacement_date, time, end_time } = req.body;

  if (!student_id || !attendance_id || !replacement_date || !/^\d{4}-\d{2}-\d{2}$/.test(replacement_date)) {
    return res.status(400).json({ error: 'student_id, attendance_id, and valid replacement_date (YYYY-MM-DD) are required' });
  }

  const student = db.prepare('SELECT id, credits FROM student WHERE id = ?').get(student_id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const attendance = db.prepare(
    'SELECT * FROM attendance_record WHERE id = ? AND student_id = ?'
  ).get(attendance_id, student_id);
  if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });

  if (attendance.status !== 'absent') {
    return res.status(400).json({ error: 'Can only set replacement for absent records' });
  }
  if (attendance.replacement_date) {
    return res.status(400).json({ error: 'Replacement already set for this attendance record' });
  }
  if (student.credits < 1) {
    return res.status(400).json({ error: 'Student has no credits to use' });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (replacement_date <= today) {
    return res.status(400).json({ error: 'Replacement date must be in the future' });
  }

  const transaction = db.transaction(() => {
    db.prepare('UPDATE attendance_record SET replacement_date = ? WHERE id = ?').run(replacement_date, attendance_id);
    db.prepare('UPDATE student SET credits = credits - 1 WHERE id = ?').run(student_id);
    var insertUpsert = "INSERT INTO attendance_record (student_id, date, status, time, end_time, replacement_for_id) VALUES (?, ?, 'present', ?, ?, ?) ON CONFLICT(student_id, date) DO UPDATE SET status = 'present', time = excluded.time, end_time = excluded.end_time, replacement_for_id = COALESCE(excluded.replacement_for_id, replacement_for_id)";
    db.prepare(insertUpsert).run(student_id, replacement_date, time || null, end_time || null, attendance_id);
  });

  transaction();

  const updated = db.prepare('SELECT * FROM attendance_record WHERE id = ?').get(attendance_id);
  const updatedStudent = db.prepare('SELECT credits FROM student WHERE id = ?').get(student_id);
  const replacementRecord = db.prepare('SELECT * FROM attendance_record WHERE student_id = ? AND date = ? AND replacement_for_id = ?').get(student_id, replacement_date, attendance_id);
  res.json({ attendance: updated, credits: updatedStudent.credits, replacementRecord: replacementRecord });
});


// Edit replacement date (only if date has not passed yet)
router.patch('/:id/replacement', (req, res) => {
  const { replacement_date, time, end_time } = req.body;
  if (!replacement_date || !/^\d{4}-\d{2}-\d{2}$/.test(replacement_date)) {
    return res.status(400).json({ error: 'Valid replacement_date (YYYY-MM-DD) is required' });
  }

  const record = db.prepare('SELECT * FROM attendance_record WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Attendance record not found' });
  if (record.status !== 'absent') {
    return res.status(400).json({ error: 'Can only set replacement for absent records' });
  }
  if (!record.replacement_date) {
    return res.status(400).json({ error: 'No replacement currently set. Use the replacement endpoint instead.' });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (record.replacement_date <= today) {
    return res.status(400).json({ error: 'Cannot edit a replacement date that has already passed or is today' });
  }
  if (replacement_date <= today) {
    return res.status(400).json({ error: 'New replacement date must be in the future' });
  }

  db.prepare('UPDATE attendance_record SET replacement_date = ? WHERE id = ?').run(replacement_date, req.params.id);
  if (time !== undefined || end_time !== undefined) {
    var replacementRec = db.prepare('SELECT id FROM attendance_record WHERE replacement_for_id = ? AND date = ?').get(req.params.id, record.replacement_date);
    if (replacementRec) {
      db.prepare('UPDATE attendance_record SET date = ?, time = ?, end_time = ? WHERE id = ?').run(replacement_date, time || null, end_time || null, replacementRec.id);
    }
  }
  const updated = db.prepare('SELECT * FROM attendance_record WHERE id = ?').get(req.params.id);
  res.json({ attendance: updated });
});

module.exports = router;