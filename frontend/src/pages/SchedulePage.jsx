import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import { getClasses, getStudents, createSchedule, getSchedules, deleteSchedule, markScheduleAttendance } from '../api/client.js';

function SchedulePage() {
  var navigate = useNavigate();
  var [classes, setClasses] = useState([]);
  var [selectedClassId, setSelectedClassId] = useState('');
  var [students, setStudents] = useState([]);
  var [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  var [time, setTime] = useState('09:00');
  var [endTime, setEndTime] = useState('10:00');
  var [notes, setNotes] = useState('');
  var [selectedIds, setSelectedIds] = useState([]);
  var [schedules, setSchedules] = useState([]);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState('');
  var [showDelete, setShowDelete] = useState(null);
  var [expandedRow, setExpandedRow] = useState(null);

  useEffect(function() { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      var [cls, sched] = await Promise.all([getClasses(false), getSchedules()]);
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
      var data = await getStudents(false, classId);
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
    setSelectedIds(function(prev) {
      return prev.includes(id) ? prev.filter(function(x) { return x !== id; }) : prev.concat([id]);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedClassId || selectedIds.length === 0) return;
    setSaving(true);
    setError('');
    try {
      await createSchedule({
        class_id: Number(selectedClassId),
        date: date,
        time: time,
        end_time: endTime || null,
        notes: notes || null,
        student_ids: selectedIds,
      });
      var sched = await getSchedules();
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
      setSchedules(function(prev) { return prev.filter(function(s) { return s.id !== id; }); });
      setShowDelete(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMark(scheduleId, studentId, status) {
    try {
      var result = await markScheduleAttendance(scheduleId, studentId, status);
      // Update the schedule's student attendance status in local state
      setSchedules(function(prev) {
        return prev.map(function(s) {
          if (s.id !== scheduleId) return s;
          var updatedStudents = s.students.map(function(st) {
            if (st.id !== studentId) return st;
            return { ...st, attendance_status: status, attendance_id: result.attendance.id };
          });
          return { ...s, students: updatedStudents };
        });
      });
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
              <select id="sched-class" value={selectedClassId} onChange={function(e) { handleClassChange(e.target.value); }} required>
                <option value="">Select a class...</option>
                {classes.map(function(c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sched-date">Date</label>
              <input id="sched-date" type="date" value={date} onChange={function(e) { setDate(e.target.value); }} required />
            </div>
            <div className="form-group">
              <label htmlFor="sched-time">Start Time</label>
              <input id="sched-time" type="time" value={time} onChange={function(e) { setTime(e.target.value); }} required />
            </div>
            <div className="form-group">
              <label htmlFor="sched-end">End Time</label>
              <input id="sched-end" type="time" value={endTime} onChange={function(e) { setEndTime(e.target.value); }} />
            </div>
            <div className="form-group">
              <label htmlFor="sched-notes">Notes</label>
              <input id="sched-notes" value={notes} onChange={function(e) { setNotes(e.target.value); }} placeholder="Optional" />
            </div>
          </div>

          {selectedClassId && (
            <div className="form-group">
              <label>Students</label>
              {students.length === 0 ? (
                <p className="status-text">No students in this class.</p>
              ) : (
                <div className="student-check-list">
                  {students.map(function(s) {
                    return (
                      <label key={s.id} className="student-check-item">
                        <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={function() { toggleStudent(s.id); }} />
                        <span>{s.name}</span>
                        {s.stage_name && <span className="inactive-label" style={{ fontSize: 11, marginLeft: 6 }}>{s.stage_name}</span>}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={saving || selectedIds.length === 0} style={{ marginTop: 12 }}>
            {saving ? 'Saving...' : 'Schedule Class (' + selectedIds.length + ' student(s))'}
          </button>
        </form>
      </div>

      <h2 className="section-title">Upcoming & Past Classes</h2>
      {schedules.length === 0 ? (
        <p className="status-text">No scheduled classes yet.</p>
      ) : (
        <div className="attendance-table">
          <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr 60px 60px 50px 1fr 60px' }}>
            <span>Date</span>
            <span>Start</span>
            <span>End</span>
            <span>Dur.</span>
            <span>Class</span>
            <span>Actions</span>
          </div>
          {function() {
            var rows = [];
            for (var si = 0; si < schedules.length; si++) {
              var sc = schedules[si];
              var start = (sc.time || '').split(':');
              var end = (sc.end_time || '').split(':');
              var duration = '';
              if (sc.time && sc.end_time) {
                var totalMin = (Number(end[0]) * 60 + Number(end[1])) - (Number(start[0]) * 60 + Number(start[1]));
                if (totalMin > 0) {
                  duration = Math.floor(totalMin / 60) + 'h' + (totalMin % 60 > 0 ? totalMin % 60 + 'm' : '');
                }
              }
              rows.push(
                <div key={sc.id}>
                  <div
                    className="attendance-table-row"
                    style={{ gridTemplateColumns: '1fr 60px 60px 50px 1fr 60px', cursor: 'pointer' }}
                    onClick={function() { setExpandedRow(expandedRow === sc.id ? null : sc.id); }}
                  >
                    <span>{sc.date}</span>
                    <span>{sc.time}</span>
                    <span>{sc.end_time || '—'}</span>
                    <span>{duration}</span>
                    <span>{sc.class_name}</span>
                    <span className="attendance-row-actions" onClick={function(e) { e.stopPropagation(); }}>
                      <button className="btn-danger btn-xs" onClick={function() { setShowDelete(sc.id); }}>Del</button>
                    </span>
                  </div>
                  {expandedRow === sc.id && sc.students && (
                    <div className="schedule-students-panel">
                      {sc.students.map(function(st) {
                        var attStatus = st.attendance_status;
                        return (
                          <div key={st.id} className="schedule-student-row">
                            <span className="schedule-student-name">{st.name}</span>
                            {!attStatus && (
                              <div className="attendance-row-actions">
                                <button className="btn-primary btn-xs" onClick={function() { handleMark(sc.id, st.id, 'present'); }}>Present</button>
                                <button className="btn-danger btn-xs" onClick={function() { handleMark(sc.id, st.id, 'absent'); }}>Absent</button>
                              </div>
                            )}
                            {attStatus === 'present' && (
                              <div className="attendance-row-actions">
                                <span className="inactive-label" style={{ color: '#065f46', background: '#d1fae5' }}>Present</span>
                                <button className="btn-danger btn-xs" onClick={function() { handleMark(sc.id, st.id, 'absent'); }}>Absent</button>
                              </div>
                            )}
                            {attStatus === 'absent' && (
                              <div className="attendance-row-actions">
                                <span className="inactive-label" style={{ color: '#991b1b', background: '#fee2e2' }}>Absent</span>
                                <button className="btn-primary btn-xs" onClick={function() { handleMark(sc.id, st.id, 'present'); }}>Present</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {(!sc.students || sc.students.length === 0) && <p className="status-text" style={{ padding: 8 }}>No students</p>}
                    </div>
                  )}
                </div>
              );
            }
            return rows;
          }()}
        </div>
      )}

      {showDelete && (
        <Modal title="Delete Scheduled Class" onClose={function() { setShowDelete(null); }}>
          <p>Are you sure you want to delete this scheduled class?</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={function() { setShowDelete(null); }}>Cancel</button>
            <button className="btn-danger" onClick={function() { handleDelete(showDelete); }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SchedulePage;