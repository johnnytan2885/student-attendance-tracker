import { useState, useEffect } from 'react';
import { getStudents, getClasses, markAttendance } from '../api/client.js';

function AttendanceForm() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [selected, setSelected] = useState({});
  const [multiMode, setMultiMode] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('present');
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
      const initRecord = {};
      const initSelect = {};
      data.forEach(s => { initRecord[s.id] = 'present'; initSelect[s.id] = false; });
      setRecords(initRecord);
      setSelected(initSelect);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleStatus(studentId) {
    if (multiMode) return;
    setRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  }

  function toggleSelected(studentId) {
    if (!multiMode) return;
    setSelected(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  }

  function markSelectedAs(status) {
    const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([id]) => Number(id));
    setRecords(prev => {
      const next = { ...prev };
      selectedIds.forEach(id => { next[id] = status; });
      return next;
    });
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
      setSuccess(`Attendance saved for ${result.created + (result.updated || 0)} student(s) on ${date}`);
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

  const selectedCount = Object.values(selected).filter(Boolean).length;

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
            <input id="attendance-date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="attendance-class">Class</label>
            <select id="attendance-class" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} required>
              <option value="">Select a class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedClassId && (
            <div className="attendance-controls">
              <label className="toggle-label">
                <input type="checkbox" checked={multiMode} onChange={e => {
                  setMultiMode(e.target.checked);
                  if (!e.target.checked) {
                    const reset = {};
                    students.forEach(s => { reset[s.id] = false; });
                    setSelected(reset);
                  }
                }} />
                Batch mark mode
              </label>
              {multiMode && (
                <div className="bulk-controls">
                  <span className="status-text">{selectedCount} selected</span>
                  <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                  <button type="button" className="btn-primary btn-sm" onClick={() => markSelectedAs(bulkStatus)} disabled={selectedCount === 0}>
                    Apply to Selected
                  </button>
                </div>
              )}
            </div>
          )}

          {loading && <p className="status-text">Loading students...</p>}
          {error && <p className="form-error">{error}</p>}

          {!loading && students.length === 0 && selectedClassId && (
            <p className="status-text">No students assigned to this class.</p>
          )}
          {!loading && !selectedClassId && (
            <p className="status-text">Select a class to mark attendance.</p>
          )}

          <div className="attendance-list">
            {students.map(student => {
              const isMarkedPresent = records[student.id] === 'present';
              const isMarkedAbsent = records[student.id] === 'absent';
              return (
                <div key={student.id} className="attendance-row">
                  {multiMode && (
                    <input
                      type="checkbox"
                      className="attendance-checkbox"
                      checked={selected[student.id] || false}
                      onChange={() => toggleSelected(student.id)}
                    />
                  )}
                  <span className="attendance-name">{student.name}</span>
                  {student.stage_name && <span className="inactive-label" style={{ fontSize: 11 }}>{student.stage_name}</span>}
                  <button
                    type="button"
                    className={`attendance-toggle ${isMarkedPresent ? 'toggle-present' : isMarkedAbsent ? 'toggle-absent' : ''}`}
                    onClick={() => toggleStatus(student.id)}
                    aria-pressed={isMarkedPresent}
                  >
                    <span className="toggle-label-text">
                      {isMarkedPresent ? 'Present' : isMarkedAbsent ? 'Absent' : '—'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {students.length > 0 && (
            <button type="submit" className="btn-primary attendance-submit">
              {submitting ? 'Saving...' : 'Save Attendance'}
            </button>
          )}
        </form>
      )}
    </div>
  );
}

export default AttendanceForm;