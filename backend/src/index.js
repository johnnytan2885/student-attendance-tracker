require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initialize } = require('../migrations/init');
const { requireAuth, requireStudentAuth } = require('./auth');

const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const classRoutes = require('./routes/classes');
const scheduleRoutes = require('./routes/schedules');
const studentClassRoutes = require('./routes/student-classes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initialize();

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'TutorTrack API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/students', requireAuth, studentRoutes);
app.use('/api/attendance', requireAuth, attendanceRoutes);
app.use('/api/classes', requireAuth, classRoutes);
app.use('/api/student/classes', requireStudentAuth, studentClassRoutes);
app.use('/api/schedules', requireAuth, scheduleRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});