const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: get students with attendance status for a scheduled class
function getStudentsWithAttendance(scId, scDate) {
  const students = db.prepare(
    `SELECT s.id, s.name, ar.status as attendance_status, ar.id as attendance_id
     FROM scheduled_class_student scs
     JOIN student s ON s.id = scs.student_id
     LEFT JOIN attendance_record ar ON ar.student_id = s.id AND ar.date = ? AND ar.scheduled_class_id = ?
     WHERE scs.scheduled_class_id = ?
     ORDER BY s.name`
  ).all(scDate, scId, scId);
  return students;
}

// Create a scheduled class
router.post('/', function(req, res) {
  const { class_id, date, time, end_time, notes, student_ids } = req.body;
  if (!class_id || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'class_id and valid date (YYYY-MM-DD) are required' });
  }
  if (!time) return res.status(400).json({ error: 'time is required' });
  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    return res.status(400).json({ error: 'At least one student is required' });
  }

  var cls = db.prepare('SELECT id FROM class WHERE id = ?').get(class_id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  for (var si = 0; si < student_ids.length; si++) {
    var s = db.prepare('SELECT id FROM student WHERE id = ?').get(student_ids[si]);
    if (!s) return res.status(404).json({ error: 'Student not found: ' + student_ids[si] });
  }

  var scId;
  var transaction = db.transaction(function() {
    var result = db.prepare('INSERT INTO scheduled_class (class_id, date, time, end_time, notes) VALUES (?, ?, ?, ?, ?)').run(
      class_id, date, time, end_time || null, notes || null
    );
    scId = result.lastInsertRowid;
    var insertStudent = db.prepare('INSERT INTO scheduled_class_student (scheduled_class_id, student_id) VALUES (?, ?)');
    for (var si = 0; si < student_ids.length; si++) {
      insertStudent.run(scId, student_ids[si]);
    }
  });
  transaction();

  var sc = db.prepare('SELECT * FROM scheduled_class WHERE id = ?').get(scId);
  var students = getStudentsWithAttendance(scId, date);
  res.status(201).json({ ...sc, students: students });
});

// Mark a student in a scheduled class as present or absent
router.post('/:id/mark', function(req, res) {
  var { student_id, status } = req.body;
  if (!student_id || !status || !['present', 'absent'].includes(status)) {
    return res.status(400).json({ error: 'student_id and status (present/absent) required' });
  }

  var sc = db.prepare('SELECT * FROM scheduled_class WHERE id = ?').get(req.params.id);
  if (!sc) return res.status(404).json({ error: 'Scheduled class not found' });

  var cs = db.prepare('SELECT id FROM scheduled_class_student WHERE scheduled_class_id = ? AND student_id = ?').get(req.params.id, student_id);
  if (!cs) return res.status(400).json({ error: 'Student not in this scheduled class' });

  // Check existing attendance
  var existing = db.prepare('SELECT id, status FROM attendance_record WHERE student_id = ? AND date = ?').get(student_id, sc.date);

  var addCredit = db.prepare('UPDATE student SET credits = credits + 1 WHERE id = ?');
  var removeCredit = db.prepare('UPDATE student SET credits = MAX(0, credits - 1) WHERE id = ?');
  var upsert = db.prepare(
    'INSERT INTO attendance_record (student_id, date, status, time, end_time, scheduled_class_id) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status, time = excluded.time, end_time = excluded.end_time, scheduled_class_id = COALESCE(excluded.scheduled_class_id, scheduled_class_id), replacement_date = CASE WHEN excluded.status = \'present\' THEN NULL ELSE replacement_date END'
  );

  var transaction = db.transaction(function() {
    if (existing) {
      if (existing.status === 'absent' && status === 'present') removeCredit.run(student_id);
      if (existing.status === 'present' && status === 'absent') addCredit.run(student_id);
    } else {
      if (status === 'absent') addCredit.run(student_id);
    }
    upsert.run(student_id, sc.date, status, sc.time, sc.end_time || null, req.params.id);
  });
  transaction();

  var ar = db.prepare('SELECT * FROM attendance_record WHERE student_id = ? AND date = ?').get(student_id, sc.date);
  var student = db.prepare('SELECT credits FROM student WHERE id = ?').get(student_id);
  res.json({ attendance: ar, credits: student.credits });
});

// Get all scheduled classes (with attendance status + replacement entries)
router.get('/', function(req, res) {
  var schedules = db.prepare(
    'SELECT sc.*, c.name as class_name FROM scheduled_class sc JOIN class c ON c.id = sc.class_id ORDER BY sc.date DESC, sc.time DESC'
  ).all();

  var result = schedules.map(function(sc) {
    var students = getStudentsWithAttendance(sc.id, sc.date);
    return { ...sc, students: students, type: 'scheduled' };
  });

  // Include replacement entries
  var replacements = db.prepare(
    "SELECT ar.*, s.name as student_name FROM attendance_record ar JOIN student s ON s.id = ar.student_id WHERE ar.replacement_date IS NOT NULL ORDER BY ar.replacement_date, ar.replacement_time"
  ).all();

  replacements.forEach(function(r) {
    var markRecord = db.prepare("SELECT id, status FROM attendance_record WHERE replacement_for_id = ?").get(r.id);
    result.push({
      id: 'rep-' + r.id,
      class_name: r.student_name + ' (Replacement for ' + r.date + ')',
      date: r.replacement_date,
      time: r.replacement_time || null,
      end_time: r.replacement_end_time || null,
      students: [{ 
        id: r.student_id,
        name: r.student_name, 
        attendance_status: markRecord ? markRecord.status : null, 
        attendance_id: markRecord ? markRecord.id : null 
      }],
      type: 'replacement',
      source_absent_id: r.id,
      student_id: r.student_id
    });
  });

  res.json(result);
});

// Get scheduled classes for a date range (includes attendance status + replacement records)
router.get('/range', function(req, res) {
  var { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates required (YYYY-MM-DD)' });

  var schedules = db.prepare(
    'SELECT sc.*, c.name as class_name FROM scheduled_class sc JOIN class c ON c.id = sc.class_id WHERE sc.date >= ? AND sc.date <= ? ORDER BY sc.date, sc.time'
  ).all(from, to);

  var result = schedules.map(function(sc) {
    var students = getStudentsWithAttendance(sc.id, sc.date);
    return { ...sc, students: students, type: 'scheduled' };
  });

  // Include replacement class records — show them as events on the replacement_date
  var replacements = db.prepare(
    "SELECT ar.*, s.name as student_name FROM attendance_record ar JOIN student s ON s.id = ar.student_id WHERE ar.replacement_date IS NOT NULL AND ar.replacement_date >= ? AND ar.replacement_date <= ? ORDER BY ar.replacement_date, ar.replacement_time"
  ).all(from, to);

  replacements.forEach(function(r) {
    // Check if a marking attendance record already exists for this replacement
    var markRecord = db.prepare("SELECT id, status FROM attendance_record WHERE replacement_for_id = ?").get(r.id);
    result.push({
      id: 'rep-' + r.id,
      class_name: r.student_name + ' (Replacement for ' + r.date + ')',
      date: r.replacement_date,
      time: r.replacement_time || null,
      end_time: r.replacement_end_time || null,
      students: [{ 
        id: r.student_id,
        name: r.student_name, 
        attendance_status: markRecord ? markRecord.status : null, 
        attendance_id: markRecord ? markRecord.id : null 
      }],
      type: 'replacement',
      source_absent_id: r.id,
      student_id: r.student_id
    });
  });

  // Sort combined results by date then time
  result.sort(function(a, b) {
    var dateCmp = (a.date || '').localeCompare(b.date || '');
    if (dateCmp !== 0) return dateCmp;
    return (a.time || '00:00').localeCompare(b.time || '00:00');
  });

  res.json(result);
});

// Mark a replacement class student as present or absent
router.post("/:id/mark-replacement", function(req, res) {
  var { student_id, status, source_absent_id } = req.body;
  if (!student_id || !status || !["present", "absent"].includes(status)) {
    return res.status(400).json({ error: "student_id and status (present/absent) required" });
  }

  // Get the original absent record to find the replacement date/time
  var absentRec = db.prepare("SELECT * FROM attendance_record WHERE id = ?").get(source_absent_id);
  if (!absentRec || !absentRec.replacement_date) {
    return res.status(404).json({ error: "Replacement not found" });
  }

  var addCredit = db.prepare("UPDATE student SET credits = credits + 1 WHERE id = ?");
  var removeCredit = db.prepare("UPDATE student SET credits = MAX(0, credits - 1) WHERE id = ?");
  var upsert = db.prepare(
    "INSERT INTO attendance_record (student_id, date, status, time, end_time, replacement_for_id) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status, time = excluded.time, end_time = excluded.end_time, replacement_for_id = COALESCE(excluded.replacement_for_id, replacement_for_id)"
  );

  var existing = db.prepare("SELECT id, status FROM attendance_record WHERE student_id = ? AND date = ?").get(student_id, absentRec.replacement_date);

  var transaction = db.transaction(function() {
    if (existing) {
      if (existing.status === "absent" && status === "present") removeCredit.run(student_id);
      if (existing.status === "present" && status === "absent") addCredit.run(student_id);
    } else {
      if (status === "absent") addCredit.run(student_id);
    }
    upsert.run(student_id, absentRec.replacement_date, status, absentRec.replacement_time || null, absentRec.replacement_end_time || null, source_absent_id);
  });
  transaction();

  var ar = db.prepare("SELECT * FROM attendance_record WHERE student_id = ? AND date = ?").get(student_id, absentRec.replacement_date);
  var student = db.prepare("SELECT credits FROM student WHERE id = ?").get(student_id);
  res.json({ attendance: ar, credits: student.credits });
});

// Delete a scheduled class
router.delete('/:id', function(req, res) {
  var existing = db.prepare('SELECT id FROM scheduled_class WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Scheduled class not found' });
  db.prepare('DELETE FROM scheduled_class WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;