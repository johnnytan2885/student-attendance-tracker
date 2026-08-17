const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { date, records } = req.body;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required' });
  }
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Records array is required' });
  }

  const insertAttendance = db.prepare(
    'INSERT INTO attendance_record (student_id, date, status) VALUES (?, ?, ?)'
  );
  const updateCredits = db.prepare(
    'UPDATE student SET credits = credits + 1 WHERE id = ?'
  );
  const checkStudent = db.prepare('SELECT id FROM student WHERE id = ?');

  const transaction = db.transaction(() => {
    let count = 0;
    for (const record of records) {
      const { student_id, status } = record;
      if (!student_id || !status || !['present', 'absent'].includes(status)) {
        throw new Error(`Invalid record: student_id=${student_id}, status=${status}`);
      }
      const student = checkStudent.get(student_id);
      if (!student) {
        throw new Error(`Student not found: ${student_id}`);
      }
      insertAttendance.run(student_id, date, status);
      if (status === 'absent') {
        updateCredits.run(student_id);
      }
      count++;
    }
    return count;
  });

  try {
    const count = transaction();
    res.status(201).json({ message: `${count} attendance records created`, count });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/student/:studentId', (req, res) => {
  const student = db.prepare('SELECT id FROM student WHERE id = ?').get(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const records = db.prepare(
    'SELECT * FROM attendance_record WHERE student_id = ? ORDER BY date DESC, created_at DESC'
  ).all(req.params.studentId);
  res.json(records);
});

router.post('/replacement', (req, res) => {
  const { student_id, attendance_id, replacement_date } = req.body;

  if (!student_id || !attendance_id || !replacement_date || !/^\d{4}-\d{2}-\d{2}$/.test(replacement_date)) {
    return res.status(400).json({ error: 'student_id, attendance_id, and valid replacement_date (YYYY-MM-DD) are required' });
  }

  const student = db.prepare('SELECT id, credits FROM student WHERE id = ?').get(student_id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const attendance = db.prepare(
    'SELECT * FROM attendance_record WHERE id = ? AND student_id = ?'
  ).get(attendance_id, student_id);
  if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });

  if (attendance.replacement_date) {
    return res.status(400).json({ error: 'Replacement already set for this attendance record' });
  }
  if (student.credits < 1) {
    return res.status(400).json({ error: 'Student has no credits to use' });
  }

  const transaction = db.transaction(() => {
    db.prepare('UPDATE attendance_record SET replacement_date = ? WHERE id = ?').run(replacement_date, attendance_id);
    db.prepare('UPDATE student SET credits = credits - 1 WHERE id = ?').run(student_id);
  });

  transaction();

  const updated = db.prepare('SELECT * FROM attendance_record WHERE id = ?').get(attendance_id);
  const updatedStudent = db.prepare('SELECT credits FROM student WHERE id = ?').get(student_id);
  res.json({ attendance: updated, credits: updatedStudent.credits });
});

module.exports = router;