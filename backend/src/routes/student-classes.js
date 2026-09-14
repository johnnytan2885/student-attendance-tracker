const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireStudentAuth } = require('../auth');

router.get('/', requireStudentAuth, (req, res) => {
  const classes = db.prepare('SELECT id, name, description FROM class WHERE active = 1 ORDER BY name').all();
  res.json(classes);
});

router.get('/:id', requireStudentAuth, (req, res) => {
  const cls = db.prepare('SELECT id, name, description FROM class WHERE id = ? AND active = 1').get(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const stages = db.prepare('SELECT * FROM class_stage WHERE class_id = ? ORDER BY sort_order').all(cls.id);
  res.json({ ...cls, stages });
});

module.exports = router;
