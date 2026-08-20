const express = require('express');
const router = express.Router();
const db = require('../db');

// --- Class CRUD ---

router.get('/', (req, res) => {
  const showAll = req.query.showAll === 'true';
  const classes = showAll
    ? db.prepare('SELECT * FROM class ORDER BY name').all()
    : db.prepare('SELECT * FROM class WHERE active = 1 ORDER BY name').all();
  res.json(classes);
});

router.get('/:id', (req, res) => {
  const cls = db.prepare('SELECT * FROM class WHERE id = ?').get(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const stages = db.prepare('SELECT * FROM class_stage WHERE class_id = ? ORDER BY sort_order').all(cls.id);
  const students = db.prepare(
    `SELECT cs.id as cs_id, s.id, s.name, s.credits, cs.stage_id
     FROM class_student cs JOIN student s ON s.id = cs.student_id
     WHERE cs.class_id = ? ORDER BY s.name`
  ).all(cls.id);

  // Attach stage info to each student
  const stageMap = {};
  stages.forEach(st => { stageMap[st.id] = st; });
  const studentsWithStage = students.map(s => ({
    ...s,
    stage_name: s.stage_id ? (stageMap[s.stage_id]?.name || null) : null
  }));

  res.json({ ...cls, stages, students: studentsWithStage });
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const result = db.prepare('INSERT INTO class (name, description) VALUES (?, ?)').run(name.trim(), description || null);
  const cls = db.prepare('SELECT * FROM class WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(cls);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM class WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Class not found' });

  const { name, description } = req.body;
  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }

  db.prepare('UPDATE class SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?').run(
    name ? name.trim() : null, description !== undefined ? (description || null) : null, req.params.id
  );
  const cls = db.prepare('SELECT * FROM class WHERE id = ?').get(req.params.id);
  res.json(cls);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM class WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Class not found' });
  db.prepare('DELETE FROM class WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// --- Stages ---

router.post('/:id/stages', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Stage name is required' });
  }
  const cls = db.prepare('SELECT id FROM class WHERE id = ?').get(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM class_stage WHERE class_id = ?').get(req.params.id);
  const result = db.prepare('INSERT INTO class_stage (class_id, name, sort_order) VALUES (?, ?, ?)').run(
    req.params.id, name.trim(), (maxOrder?.m ?? -1) + 1
  );
  const stage = db.prepare('SELECT * FROM class_stage WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(stage);
});

router.put('/stages/:stageId', (req, res) => {
  const existing = db.prepare('SELECT * FROM class_stage WHERE id = ?').get(req.params.stageId);
  if (!existing) return res.status(404).json({ error: 'Stage not found' });

  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Stage name is required' });
  }

  db.prepare('UPDATE class_stage SET name = ? WHERE id = ?').run(name.trim(), req.params.stageId);
  const stage = db.prepare('SELECT * FROM class_stage WHERE id = ?').get(req.params.stageId);
  res.json(stage);
});

router.delete('/stages/:stageId', (req, res) => {
  const existing = db.prepare('SELECT id FROM class_stage WHERE id = ?').get(req.params.stageId);
  if (!existing) return res.status(404).json({ error: 'Stage not found' });
  // Remove stage reference from students, then delete the stage
  db.prepare('UPDATE class_student SET stage_id = NULL WHERE stage_id = ?').run(req.params.stageId);
  db.prepare('DELETE FROM class_stage WHERE id = ?').run(req.params.stageId);
  res.status(204).send();
});

// --- Student Assignment ---

router.get('/:id/available-students', (req, res) => {
  const cls = db.prepare('SELECT id FROM class WHERE id = ?').get(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const students = db.prepare(
    `SELECT * FROM student WHERE id NOT IN (
      SELECT student_id FROM class_student WHERE class_id = ?
    ) AND active = 1 ORDER BY name`
  ).all(req.params.id);
  res.json(students);
});

router.post('/:id/students', (req, res) => {
  const { student_id } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id is required' });

  const cls = db.prepare('SELECT id FROM class WHERE id = ?').get(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const student = db.prepare('SELECT id FROM student WHERE id = ?').get(student_id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  try {
    db.prepare('INSERT INTO class_student (class_id, student_id) VALUES (?, ?)').run(req.params.id, student_id);
    res.status(201).json({ message: 'Student assigned to class' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Student already in this class' });
    }
    throw err;
  }
});

router.delete('/:id/students/:studentId', (req, res) => {
  db.prepare('DELETE FROM class_student WHERE class_id = ? AND student_id = ?').run(req.params.id, req.params.studentId);
  res.status(204).send();
});

router.patch('/:id/students/:studentId/stage', (req, res) => {
  const { stage_id } = req.body;
  const cs = db.prepare('SELECT id FROM class_student WHERE class_id = ? AND student_id = ?').get(req.params.id, req.params.studentId);
  if (!cs) return res.status(404).json({ error: 'Student not in this class' });
  db.prepare('UPDATE class_student SET stage_id = ? WHERE id = ?').run(stage_id || null, cs.id);
  res.json({ message: 'Stage updated' });
});

module.exports = router;