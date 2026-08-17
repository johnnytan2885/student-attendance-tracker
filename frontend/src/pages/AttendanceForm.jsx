import { useState, useEffect } from 'react';
import { getStudents, markAttendance } from '../api/client.js';

function AttendanceForm() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    setError('');
    try {
      const data = await getStudents(false);
      setStudents(data);
      const initial = {};
      data.forEach(s => { initial[s.id] = 'present'; });
      setRecords(initial);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleStatus(studentId) {
    setRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = Object.entries(records).map(([student_id, status]) => ({
        student_id: Number(student_id),
        status,
      }));
      const result = await markAttendance(date, payload);
      setSuccess(`Attendance saved for ${result.count} student(s) on ${date}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleMarkAnother() {
    setSuccess('');
    setError('');
  }

  return (
    <div>
      <h1 className="dashboard-title">Mark Attendance</h1>

      {success ? (
        <div className="attendance-success">
          <p className="success-message">{success}</p>
          <button className="btn-primary" onClick={handleMarkAnother}>Mark Another Date</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="attendance-form">
          <div className="form-group">
            <label htmlFor="attendance-date">Date</label>
            <input
              id="attendance-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {loading && <p className="status-text">Loading students...</p>}
          {error && <p className="form-error">{error}</p>}

          {!loading && students.length === 0 && (
            <p className="status-text">No active students. Add students first.</p>
          )}

          <div className="attendance-list">
            {students.map(student => (
              <div key={student.id} className="attendance-row">
                <span className="attendance-name">{student.name}</span>
                <button
                  type="button"
                  className={`attendance-toggle ${records[student.id] === 'present' ? 'toggle-present' : 'toggle-absent'}`}
                  onClick={() => toggleStatus(student.id)}
                  aria-pressed={records[student.id] === 'present'}
                >
                  <span className="toggle-label-text">
                    {records[student.id] === 'present' ? 'Present' : 'Absent'}
                  </span>
                </button>
              </div>
            ))}
          </div>

          {students.length > 0 && (
            <button
              type="submit"
              className="btn-primary attendance-submit"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Attendance'}
            </button>
          )}
        </form>
      )}
    </div>
  );
}

export default AttendanceForm;