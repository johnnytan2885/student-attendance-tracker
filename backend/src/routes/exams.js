const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireStudentAuth, requirePermission } = require('../auth');

// --- Exams (Admin) ---

router.get('/', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  const exams = db.prepare('SELECT * FROM exam ORDER BY created_at DESC').all();
  res.json(exams);
});

router.post('/', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  const { title, description, time_limit_minutes } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const result = db.prepare('INSERT INTO exam (title, description, time_limit_minutes) VALUES (?, ?, ?)').run(
    title.trim(),
    description || null,
    time_limit_minutes ? Number(time_limit_minutes) : 30
  );
  const exam = db.prepare('SELECT * FROM exam WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(exam);
});

router.get('/:id', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exam WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const questions = db.prepare('SELECT * FROM exam_question WHERE exam_id = ? ORDER BY sort_order').all(req.params.id);
  res.json({ ...exam, questions });
});

router.put('/:id', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  const existing = db.prepare('SELECT * FROM exam WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Exam not found' });

  const { title, description, time_limit_minutes, active } = req.body;
  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  db.prepare('UPDATE exam SET title = COALESCE(?, title), description = COALESCE(?, description), time_limit_minutes = COALESCE(?, time_limit_minutes), active = COALESCE(?, active) WHERE id = ?').run(
    title ? title.trim() : null,
    description !== undefined ? (description || null) : null,
    time_limit_minutes !== undefined ? Number(time_limit_minutes) : null,
    active !== undefined ? (active ? 1 : 0) : null,
    req.params.id
  );
  const exam = db.prepare('SELECT * FROM exam WHERE id = ?').get(req.params.id);
  res.json(exam);
});

router.delete('/:id', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  db.prepare('DELETE FROM exam WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// --- Questions (Admin) ---

router.post('/:id/questions', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  const exam = db.prepare('SELECT id FROM exam WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;
  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return res.status(400).json({ error: 'All question fields are required' });
  }
  if (!['A', 'B', 'C', 'D'].includes(correct_option)) {
    return res.status(400).json({ error: 'correct_option must be A, B, C, or D' });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM exam_question WHERE exam_id = ?').get(req.params.id);
  const result = db.prepare('INSERT INTO exam_question (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    req.params.id,
    question_text.trim(),
    option_a.trim(),
    option_b.trim(),
    option_c.trim(),
    option_d.trim(),
    correct_option,
    (maxOrder?.m ?? -1) + 1
  );
  const question = db.prepare('SELECT * FROM exam_question WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(question);
});

router.put('/questions/:questionId', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  const existing = db.prepare('SELECT * FROM exam_question WHERE id = ?').get(req.params.questionId);
  if (!existing) return res.status(404).json({ error: 'Question not found' });

  const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;
  if (correct_option && !['A', 'B', 'C', 'D'].includes(correct_option)) {
    return res.status(400).json({ error: 'correct_option must be A, B, C, or D' });
  }

  db.prepare('UPDATE exam_question SET question_text = COALESCE(?, question_text), option_a = COALESCE(?, option_a), option_b = COALESCE(?, option_b), option_c = COALESCE(?, option_c), option_d = COALESCE(?, option_d), correct_option = COALESCE(?, correct_option) WHERE id = ?').run(
    question_text ? question_text.trim() : null,
    option_a ? option_a.trim() : null,
    option_b ? option_b.trim() : null,
    option_c ? option_c.trim() : null,
    option_d ? option_d.trim() : null,
    correct_option || null,
    req.params.questionId
  );
  const question = db.prepare('SELECT * FROM exam_question WHERE id = ?').get(req.params.questionId);
  res.json(question);
});

router.delete('/questions/:questionId', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  db.prepare('DELETE FROM exam_question WHERE id = ?').run(req.params.questionId);
  res.status(204).send();
});

// --- Allocation (Admin) ---

router.post('/:id/allocate', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  const exam = db.prepare('SELECT id FROM exam WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const { student_ids } = req.body;
  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    return res.status(400).json({ error: 'student_ids array is required' });
  }

  const insert = db.prepare('INSERT OR IGNORE INTO student_exam (student_id, exam_id) VALUES (?, ?)');
  let count = 0;
  for (const sid of student_ids) {
    const student = db.prepare('SELECT id FROM student WHERE id = ? AND active = 1').get(sid);
    if (student) {
      insert.run(sid, req.params.id);
      count++;
    }
  }
  res.json({ message: `Allocated to ${count} student(s)` });
});

router.get('/:id/allocated', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  const exam = db.prepare('SELECT id FROM exam WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const allocated = db.prepare(
    `SELECT se.id, se.started_at, se.submitted_at, se.score, se.total_questions, s.id as student_id, s.name, s.email
     FROM student_exam se
     JOIN student s ON s.id = se.student_id
     WHERE se.exam_id = ?
     ORDER BY s.name`
  ).all(req.params.id);
  res.json(allocated);
});

router.post('/:id/reset', requireAuth, requirePermission('can_manage_exams'), (req, res) => {
  const exam = db.prepare('SELECT id FROM exam WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const { student_id } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id is required' });

  const se = db.prepare('SELECT id FROM student_exam WHERE exam_id = ? AND student_id = ?').get(req.params.id, student_id);
  if (!se) return res.status(404).json({ error: 'Student exam not found' });

  db.prepare('DELETE FROM student_answer WHERE student_exam_id = ?').run(se.id);
  db.prepare('UPDATE student_exam SET started_at = NULL, started_at_ms = NULL, submitted_at = NULL, score = 0, total_questions = 0 WHERE id = ?').run(se.id);

  const updated = db.prepare('SELECT * FROM student_exam WHERE id = ?').get(se.id);
  res.json({ message: 'Exam reset successfully', student_exam: updated });
});

// --- Student Exam Routes ---

router.get('/student/history', requireStudentAuth, (req, res) => {
  const history = db.prepare(
    `SELECT se.id, se.score, se.total_questions, se.started_at, se.submitted_at, e.id as exam_id, e.title, e.time_limit_minutes
     FROM student_exam se
     JOIN exam e ON e.id = se.exam_id
     WHERE se.student_id = ? AND se.submitted_at IS NOT NULL
     ORDER BY se.submitted_at DESC`
  ).all(req.studentId);
  res.json(history);
});

router.get('/student/available', requireStudentAuth, (req, res) => {
  const exams = db.prepare(
    `SELECT e.*, se.started_at, se.started_at_ms, se.submitted_at, se.score, se.total_questions
     FROM exam e
     JOIN student_exam se ON se.exam_id = e.id AND se.student_id = ?
     WHERE e.active = 1
     ORDER BY e.created_at DESC`
  ).all(req.studentId);
  res.json(exams);
});

router.get('/student/:id', requireStudentAuth, (req, res) => {
  const exam = db.prepare('SELECT * FROM exam WHERE id = ? AND active = 1').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const se = db.prepare('SELECT * FROM student_exam WHERE student_id = ? AND exam_id = ?').get(req.studentId, req.params.id);
  if (!se) return res.status(403).json({ error: 'You are not allocated to this exam' });

  res.json({ ...exam, student_exam: se });
});

router.get('/student/:id/questions', requireStudentAuth, (req, res) => {
  const exam = db.prepare('SELECT * FROM exam WHERE id = ? AND active = 1').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const se = db.prepare('SELECT * FROM student_exam WHERE student_id = ? AND exam_id = ?').get(req.studentId, req.params.id);
  if (!se) return res.status(403).json({ error: 'You are not allocated to this exam' });
  if (!se.started_at) return res.status(400).json({ error: 'Exam has not started yet' });
  if (se.submitted_at) return res.status(400).json({ error: 'Exam already submitted' });

  const questions = db.prepare('SELECT id, question_text, option_a, option_b, option_c, option_d, sort_order FROM exam_question WHERE exam_id = ? ORDER BY sort_order').all(req.params.id);
  res.json({ exam, student_exam: se, questions });
});

router.post('/student/:id/start', requireStudentAuth, (req, res) => {
  const exam = db.prepare('SELECT * FROM exam WHERE id = ? AND active = 1').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  let se = db.prepare('SELECT * FROM student_exam WHERE student_id = ? AND exam_id = ?').get(req.studentId, req.params.id);
  if (!se) {
    db.prepare('INSERT INTO student_exam (student_id, exam_id) VALUES (?, ?)').run(req.studentId, req.params.id);
    se = db.prepare('SELECT * FROM student_exam WHERE student_id = ? AND exam_id = ?').get(req.studentId, req.params.id);
  }
  if (!se.started_at) {
    db.prepare("UPDATE student_exam SET started_at = datetime('now'), started_at_ms = strftime('%s','now') * 1000 WHERE id = ?").run(se.id);
    se = db.prepare('SELECT * FROM student_exam WHERE id = ?').get(se.id);
  }
  res.json({ exam, student_exam: se });
});

router.post('/student/:examId/answer', requireStudentAuth, (req, res) => {
  const { question_id, selected_option } = req.body;
  if (!question_id || !selected_option || !['A', 'B', 'C', 'D'].includes(selected_option)) {
    return res.status(400).json({ error: 'question_id and selected_option (A/B/C/D) are required' });
  }

  const exam = db.prepare('SELECT * FROM exam WHERE id = ? AND active = 1').get(req.params.examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const se = db.prepare('SELECT * FROM student_exam WHERE student_id = ? AND exam_id = ?').get(req.studentId, req.params.examId);
  if (!se || !se.started_at) return res.status(400).json({ error: 'Exam not started' });
  if (se.submitted_at) return res.status(400).json({ error: 'Exam already submitted' });

  const question = db.prepare('SELECT * FROM exam_question WHERE id = ? AND exam_id = ?').get(question_id, req.params.examId);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  const isCorrect = question.correct_option === selected_option ? 1 : 0;
  db.prepare(
    'INSERT INTO student_answer (student_exam_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?) ON CONFLICT(student_exam_id, question_id) DO UPDATE SET selected_option = excluded.selected_option, is_correct = excluded.is_correct'
  ).run(se.id, question_id, selected_option, isCorrect);

  res.json({ message: 'Answer saved' });
});

router.post('/student/:id/submit', requireStudentAuth, (req, res) => {
  const exam = db.prepare('SELECT * FROM exam WHERE id = ? AND active = 1').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const se = db.prepare('SELECT * FROM student_exam WHERE student_id = ? AND exam_id = ?').get(req.studentId, req.params.id);
  if (!se || !se.started_at) return res.status(400).json({ error: 'Exam not started' });
  if (se.submitted_at) return res.status(400).json({ error: 'Exam already submitted' });

  const totalQ = db.prepare('SELECT COUNT(*) as c FROM exam_question WHERE exam_id = ?').get(req.params.id).c;
  const correct = db.prepare('SELECT COUNT(*) as c FROM student_answer WHERE student_exam_id = ? AND is_correct = 1').get(se.id).c;

  db.prepare("UPDATE student_exam SET submitted_at = datetime('now'), score = ?, total_questions = ? WHERE id = ?").run(correct, totalQ, se.id);
  const updated = db.prepare('SELECT * FROM student_exam WHERE id = ?').get(se.id);
  res.json({ exam, student_exam: updated });
});

router.get('/student/:id/result', requireStudentAuth, (req, res) => {
  const exam = db.prepare('SELECT * FROM exam WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const se = db.prepare('SELECT * FROM student_exam WHERE student_id = ? AND exam_id = ?').get(req.studentId, req.params.id);
  if (!se || !se.submitted_at) return res.status(404).json({ error: 'Result not available' });

  const questions = db.prepare('SELECT * FROM exam_question WHERE exam_id = ? ORDER BY sort_order').all(req.params.id);
  const answers = db.prepare('SELECT * FROM student_answer WHERE student_exam_id = ?').all(se.id);
  const answerMap = {};
  answers.forEach(a => { answerMap[a.question_id] = a; });

  const detailed = questions.map(q => ({
    id: q.id,
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_option: q.correct_option,
    selected_option: answerMap[q.id]?.selected_option || null,
    is_correct: answerMap[q.id]?.is_correct || 0
  }));

  res.json({ exam, student_exam: se, questions: detailed });
});

module.exports = router;
