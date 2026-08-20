import { useState, useEffect } from 'react';
import { getStudents, getClasses, markAttendance } from '../api/client.js';

function AttendanceForm() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [status, setStatus] = useState('present');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadClasses(); }, []);

  useEffect(() => {
    if (selectedClassId) loadStudents();
  }, [selectedClassId]);

  async function loadClasses() {
    setLoading(true);
    setError('');
    try {
      const data = await getClasses(false);
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(String(data[0].id));
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function loadStudents() {
    setLoading(true);
    setError('');
    try {
      const data = await getStudents(false, selectedClassId);
      setStudents(data);
      setSelectedStudentId('');
      setStatus('present');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedStudentId) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const result = await markAttendance(date, [{ student_id: Number(selectedStudentId), status }]);
      setSuccess(`Attendance saved for ${students.find(s => String(s.id) === selectedStudentId)?.name} on ${date}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleMarkAnother() {
    setSuccess('');
    setError('');
    setSelectedStudentId('');
  }

  return (
    <div>
      <h1 className="dashboard-title">Mark Attendance</h1>

      {success ? (
        <div className="attendance-success">
          <p className="success-message">{success}</p>
          <button className="btn-primary" onClick={handleMarkAnother}>Mark Another</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="attendance-form">
          <div className="form-group">
            <label htmlFor="attendance-date">Date</label>
            <input id="attendance-date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="attendance-class">Class</label>
            <select id="attendance-class" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} required>
              <option value="">Select a class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {loading && <p className="status-text">Loading students...</p>}
          {error && <p className="form-error">{error}</p>}

          {!loading && selectedClassId && students.length === 0 && (
            <p className="status-text">No students assigned to this class.</p>
          )}
          {!loading && !selectedClassId && (
            <p className="status-text">Select a class to mark attendance.</p>
          )}

          {students.length > 0 && (
            <>
              <div className="form-group">
                <label htmlFor="attendance-student">Student</label>
                <select id="attendance-student" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} required>
                  <option value="">Select a student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.stage_name ? ` (${s.stage_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudentId && (
                <div className="form-group">
                  <label>Status</label>
                  <div className="attendance-status-options">
                    <button
                      type="button"
                      className={`attendance-option ${status === 'present' ? 'option-present' : ''}`}
                      onClick={() => setStatus('present')}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      className={`attendance-option ${status === 'absent' ? 'option-absent' : ''}`}
                      onClick={() => setStatus('absent')}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              )}

              {selectedStudentId && (
                <button type="submit" className="btn-primary attendance-submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Attendance'}
                </button>
              )}
            </>
          )}
        </form>
      )}
    </div>
  );
}

export default AttendanceForm;