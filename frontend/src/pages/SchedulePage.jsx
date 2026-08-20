import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import { getClasses, getStudents, createSchedule, getSchedules, deleteSchedule } from '../api/client.js';

function SchedulePage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cls, sched] = await Promise.all([getClasses(false), getSchedules()]);
      setClasses(cls);
      setSchedules(sched);
      if (cls.length > 0) {
        setSelectedClassId(String(cls[0].id));
        loadStudents(cls[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function loadStudents(classId) {
    try {
      const data = await getStudents(false, classId);
      setStudents(data);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClassChange(cid) {
    setSelectedClassId(cid);
    if (cid) loadStudents(cid);
  }

  function toggleStudent(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedClassId || selectedIds.length === 0) return;
    setSaving(true);
    setError('');
    try {
      await createSchedule({
        class_id: Number(selectedClassId),
        date,
        time,
        end_time: endTime || null,
        notes: notes || null,
        student_ids: selectedIds,
      });
      const sched = await getSchedules();
      setSchedules(sched);
      setSelectedIds([]);
      setNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      setShowDelete(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="status-text">Loading...</p>;

  return (
    <div>
      <h1 className="dashboard-title">Schedule Classes</h1>

      {error && <p className="form-error">{error}</p>}

      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label htmlFor="sched-class">Class</label>
              <select id="sched-class" value={selectedClassId} onChange={e => handleClassChange(e.target.value)} required>
                <option value="">Select a class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sched-date">Date</label>
              <input id="sched-date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="sched-time">Start Time</label>
              <input id="sched-time" type="time" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="sched-end">End Time</label>
              <input id="sched-end" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="sched-notes">Notes</label>
              <input id="sched-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {selectedClassId && (
            <div className="form-group">
              <label>Students</label>
              {students.length === 0 ? (
                <p className="status-text">No students in this class.</p>
              ) : (
                <div className="student-check-list">
                  {students.map(s => (
                    <label key={s.id} className="student-check-item">
                      <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                      <span>{s.name}</span>
                      {s.stage_name && <span className="inactive-label" style={{ fontSize: 11, marginLeft: 6 }}>{s.stage_name}</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={saving || selectedIds.length === 0} style={{ marginTop: 12 }}>
            {saving ? 'Saving...' : `Schedule Class (${selectedIds.length} student(s))`}
          </button>
        </form>
      </div>

      <h2 className="section-title">Upcoming & Past Classes</h2>
      {schedules.length === 0 ? (
        <p className="status-text">No scheduled classes yet.</p>
      ) : (
        <div className="attendance-table">
          <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr 70px 70px 70px 2fr 80px' }}>
            <span>Date</span>
            <span>Start</span>
            <span>End</span>
            <span>Dur.</span>
            <span>Class</span>
            <span>Actions</span>
          </div>
          {function() {
            const rows = [];
            for (const sc of schedules) {
              const start = (sc.time || '').split(':');
              const end = (sc.end_time || '').split(':');
              let duration = '';
              if (sc.time && sc.end_time) {
                const totalMin = (Number(end[0]) * 60 + Number(end[1])) - (Number(start[0]) * 60 + Number(start[1]));
                if (totalMin > 0) {
                  const h = Math.floor(totalMin / 60);
                  const m = totalMin % 60;
                  duration = h + 'h' + (m > 0 ? m + 'm' : '');
                }
              }
              rows.push(
                <div key={sc.id} className="attendance-table-row" style={{ gridTemplateColumns: '1fr 70px 70px 70px 2fr 80px' }}>
                  <span>{sc.date}</span>
                  <span>{sc.time}</span>
                  <span>{sc.end_time || '—'}</span>
                  <span>{duration}</span>
                  <span>{sc.class_name}</span>
                  <span className="attendance-row-actions">
                    <button className="btn-danger btn-xs" onClick={() => setShowDelete(sc.id)}>Del</button>
                  </span>
                </div>
              );
            }
            return rows;
          }()}
        </div>
      )}

      {showDelete && (
        <Modal title="Delete Scheduled Class" onClose={() => setShowDelete(null)}>
          <p>Are you sure you want to delete this scheduled class?</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDelete(showDelete)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SchedulePage;