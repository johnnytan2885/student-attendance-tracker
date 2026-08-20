const express = require('express');
const router = express.Router();
const db = require('../db');

// Create a scheduled class
router.post('/', (req, res) => {
  const { class_id, date, time, notes, student_ids } = req.body;
  if (!class_id || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'class_id and valid date (YYYY-MM-DD) are required' });
  }
  if (!time) return res.status(400).json({ error: 'time is required' });
  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    return res.status(400).json({ error: 'At least one student is required' });
  }

  const cls = db.prepare('SELECT id FROM class WHERE id = ?').get(class_id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  for (const sid of student_ids) {
    const s = db.prepare('SELECT id FROM student WHERE id = ?').get(sid);
    if (!s) return res.status(404).json({ error: `Student not found: ${sid}` });
  }

  const transaction = db.transaction(() => {
    const result = db.prepare('INSERT INTO scheduled_class (class_id, date, time, notes) VALUES (?, ?, ?, ?)').run(
      class_id, date, time, notes || null
    );
    const scId = result.lastInsertRowid;
    const insertStudent = db.prepare('INSERT INTO scheduled_class_student (scheduled_class_id, student_id) VALUES (?, ?)');
    for (const sid of student_ids) {
      insertStudent.run(scId, sid);
    }
    return scId;
  });

  const scId = transaction();
  const sc = db.prepare('SELECT * FROM scheduled_class WHERE id = ?').get(scId);
  const students = db.prepare(
    `SELECT s.id, s.name FROM scheduled_class_student scs
     JOIN student s ON s.id = scs.student_id
     WHERE scs.scheduled_class_id = ? ORDER BY s.name`
  ).all(scId);
  res.status(201).json({ ...sc, students });
});

// Get all scheduled classes
router.get('/', (req, res) => {
  const schedules = db.prepare(
    `SELECT sc.*, c.name as class_name
     FROM scheduled_class sc
     JOIN class c ON c.id = sc.class_id
     ORDER BY sc.date DESC, sc.time DESC`
  ).all();

  const result = schedules.map(sc => {
    const students = db.prepare(
      `SELECT s.id, s.name FROM scheduled_class_student scs
       JOIN student s ON s.id = scs.student_id
       WHERE scs.scheduled_class_id = ? ORDER BY s.name`
    ).all(sc.id);
    return { ...sc, students };
  });
  res.json(result);
});

// Get scheduled classes for a date range (for dashboard calendar)
router.get('/range', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates required (YYYY-MM-DD)' });

  const schedules = db.prepare(
    `SELECT sc.*, c.name as class_name
     FROM scheduled_class sc
     JOIN class c ON c.id = sc.class_id
     WHERE sc.date >= ? AND sc.date <= ?
     ORDER BY sc.date, sc.time`
  ).all(from, to);

  const result = schedules.map(sc => {
    const students = db.prepare(
      `SELECT s.id, s.name FROM scheduled_class_student scs
       JOIN student s ON s.id = scs.student_id
       WHERE scs.scheduled_class_id = ? ORDER BY s.name`
    ).all(sc.id);
    return { ...sc, students };
  });
  res.json(result);
});

// Delete a scheduled class
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM scheduled_class WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Scheduled class not found' });
  db.prepare('DELETE FROM scheduled_class WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;