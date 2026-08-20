const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const showAll = req.query.showAll === 'true';
  const classId = req.query.class_id;
  let students;
  if (classId) {
    students = db.prepare(
      `SELECT s.*, cs.stage_id, cs_st.name as stage_name, c.name as class_name
       FROM student s
       JOIN class_student cs ON cs.student_id = s.id
       JOIN class c ON c.id = cs.class_id
       LEFT JOIN class_stage cs_st ON cs_st.id = cs.stage_id
       WHERE cs.class_id = ? AND s.active = 1
       ORDER BY s.name`
    ).all(classId);
  } else {
    students = showAll
      ? db.prepare('SELECT * FROM student ORDER BY name').all()
      : db.prepare('SELECT * FROM student WHERE active = 1 ORDER BY name').all();
  }
  res.json(students);
});

router.get('/:id', (req, res) => {
  const student = db.prepare('SELECT * FROM student WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const classes = db.prepare(
    `SELECT c.id, c.name, c.description, cs.stage_id, cs_st.name as stage_name
     FROM class_student cs
     JOIN class c ON c.id = cs.class_id
     LEFT JOIN class_stage cs_st ON cs_st.id = cs.stage_id
     WHERE cs.student_id = ?`
  ).all(req.params.id);

  res.json({ ...student, classes });
});

router.post('/', (req, res) => {
  const { name, email, notes } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (email && typeof email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  const result = db.prepare('INSERT INTO student (name, email, notes) VALUES (?, ?, ?)').run(
    name.trim(),
    email || null,
    notes || null
  );
  const student = db.prepare('SELECT * FROM student WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(student);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM student WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Student not found' });

  const { name, email, notes } = req.body;
  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }
  if (email && typeof email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  db.prepare('UPDATE student SET name = COALESCE(?, name), email = COALESCE(?, email), notes = COALESCE(?, notes) WHERE id = ?').run(
    name ? name.trim() : null,
    email !== undefined ? (email || null) : null,
    notes !== undefined ? (notes || null) : null,
    req.params.id
  );
  const student = db.prepare('SELECT * FROM student WHERE id = ?').get(req.params.id);
  res.json(student);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM student WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Student not found' });
  db.prepare('DELETE FROM student WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

router.patch('/:id/archive', (req, res) => {
  const existing = db.prepare('SELECT * FROM student WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Student not found' });
  db.prepare('UPDATE student SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(req.params.id);
  const student = db.prepare('SELECT * FROM student WHERE id = ?').get(req.params.id);
  res.json(student);
});

module.exports = router;