import { useState, useEffect } from 'react';
import { getStudents, getClasses, markAttendance } from '../api/client.js';

function AttendanceForm() {
  var [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  var [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  var [endTime, setEndTime] = useState('');
  var [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
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
      setSelectedIds([]);
      setStatus('present');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleStudent(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = selectedIds.map(function(id) { return { student_id: id, status: status, time: time, end_time: endTime || null }; });
      const result = await markAttendance(date, payload);
      setSuccess(`Attendance saved for ${selectedIds.length} student(s) on ${date}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleMarkAnother() {
    setSuccess('');
    setError('');
    setSelectedIds([]);
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
            <label htmlFor="attendance-time">Start Time</label>
            <input id="attendance-time" type="time" value={time} onChange={function(e) { setTime(e.target.value); }} required />
          </div>

          <div className="form-group">
            <label htmlFor="attendance-end">End Time</label>
            <input id="attendance-end" type="time" value={endTime} onChange={function(e) { setEndTime(e.target.value); }} />
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
                <label>Select Student(s)</label>
                <div className="student-check-list">
                  {students.map(s => (
                    <label key={s.id} className="student-check-item">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                      />
                      <span>{s.name}</span>
                      {s.stage_name && <span className="inactive-label" style={{ fontSize: 11, marginLeft: 6 }}>{s.stage_name}</span>}
                    </label>
                  ))}
                </div>
              </div>

              {selectedIds.length > 0 && (
                <div className="form-group">
                  <label>Status for selected ({selectedIds.length})</label>
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

              {selectedIds.length > 0 && (
                <button type="submit" className="btn-primary attendance-submit" disabled={submitting}>
                  {submitting ? 'Saving...' : `Save Attendance (${selectedIds.length})`}
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