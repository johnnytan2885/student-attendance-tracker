import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import AttendanceCalendar from '../components/AttendanceCalendar.jsx';
import { getStudent, getStudentAttendance, updateStudent, archiveStudent, deleteStudent, setReplacement, editAttendance, deleteAttendance, editReplacementDate } from '../api/client.js';

function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);

  const [showReplacement, setShowReplacement] = useState(false);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState(null);
  const [replacementDate, setReplacementDate] = useState('');
  const [replacing, setReplacing] = useState(false);

  // Edit attendance state
  const [showEditAttendance, setShowEditAttendance] = useState(null);
  const [editAttendanceStatus, setEditAttendanceStatus] = useState('');

  // Delete attendance state
  const [showDeleteAttendance, setShowDeleteAttendance] = useState(null);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [studentData, attendanceData] = await Promise.all([
        getStudent(id),
        getStudentAttendance(id),
      ]);
      setStudent(studentData);
      setAttendance(attendanceData);
      setEditName(studentData.name);
      setEditEmail(studentData.email || '');
      setEditNotes(studentData.notes || '');
    } catch (err) {
      setError(err.message);
      if (err.status === 404) setError('Student not found.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await updateStudent(id, { name: editName, email: editEmail || null, notes: editNotes || null });
      setStudent(updated);
      setShowEdit(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    try {
      const updated = await archiveStudent(id);
      setStudent(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    try {
      await deleteStudent(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetReplacement(e) {
    e.preventDefault();
    if (!selectedAttendanceId || !replacementDate) return;
    setReplacing(true);
    setError('');
    try {
      const result = await setReplacement(Number(id), selectedAttendanceId, replacementDate);
      setStudent(prev => ({ ...prev, credits: result.credits }));
      setAttendance(prev =>
        prev.map(a => a.id === selectedAttendanceId ? { ...a, replacement_date: replacementDate } : a)
      );
      setShowReplacement(false);
      setReplacementDate('');
      setSelectedAttendanceId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setReplacing(false);
    }
  }

  async function handleEditAttendance(record) {
    setError('');
    try {
      const result = await editAttendance(record.id, editAttendanceStatus);
      setAttendance(prev => prev.map(a => a.id === record.id ? result.attendance : a));
      setStudent(prev => ({ ...prev, credits: result.credits }));
      setShowEditAttendance(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteAttendance(record) {
    setError('');
    try {
      const result = await deleteAttendance(record.id);
      setAttendance(prev => prev.filter(a => a.id !== record.id));
      setStudent(prev => ({ ...prev, credits: result.credits }));
      setShowDeleteAttendance(null);
    } catch (err) {
      setError(err.message);
    }
  }

  const eligibleForReplacement = attendance.filter(
    a => a.status === 'absent' && !a.replacement_date
  );

  if (loading) return <p className="status-text">Loading student profile...</p>;
  if (!student && error) return <p className="form-error">{error}</p>;
  if (!student) return <p className="form-error">Student not found.</p>;

  return (
    <div className="profile-page">
      {error && <p className="form-error">{error}</p>}
      <button className="btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
        &larr; Back to Students
      </button>

      <div className="card profile-header">
        <div className="profile-header-row">
          <h1 className="profile-name">{student.name}</h1>
          <span className={`credit-badge ${student.credits > 0 ? 'has-credits' : ''}`}>
            {student.credits} credit{student.credits !== 1 ? 's' : ''}
          </span>
        </div>
        {student.email && <p className="profile-detail">Email: {student.email}</p>}
        {student.notes && <p className="profile-detail">Notes: {student.notes}</p>}
        {!student.active && <span className="inactive-label">Archived</span>}
        <div className="profile-actions">
          <button className="btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn-secondary btn-sm" onClick={handleArchive}>
            {student.active ? 'Archive' : 'Unarchive'}
          </button>
          <button className="btn-danger btn-sm" onClick={() => setShowDelete(true)}>Delete</button>
        </div>
      </div>

      {student.credits > 0 && eligibleForReplacement.length > 0 && (
        <div className="card replacement-card">
          <p className="replacement-hint">
            {student.name} has {student.credits} credit(s) available.
          </p>
          <button className="btn-primary btn-sm" onClick={() => setShowReplacement(true)}>
            Set Replacement Class
          </button>
        </div>
      )}

      <AttendanceCalendar attendanceRecords={attendance} />

      <div className="card attendance-section">
        <h2 className="section-title">Attendance History</h2>
        {attendance.length === 0 ? (
          <p className="status-text">No attendance records yet.</p>
        ) : (
          <div className="attendance-table">
            <div className="attendance-table-header">
              <span>Date</span>
              <span>Status</span>
              <span>Replacement</span>
              <span>Actions</span>
            </div>
            {attendance.map(record => (
              <div
                key={record.id}
                className={`attendance-table-row ${record.status === 'absent' ? 'row-absent' : 'row-present'}`}
              >
                <span>{record.date}</span>
                <span>{record.status === 'present' ? 'Present' : 'Absent'}</span>
                <span>{record.replacement_date || '—'}</span>
                <span className="attendance-row-actions">
                  <button
                    className="btn-secondary btn-xs"
                    onClick={() => { setShowEditAttendance(record); setEditAttendanceStatus(record.status); }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger btn-xs"
                    onClick={() => setShowDeleteAttendance(record)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEdit && (
        <Modal title="Edit Student" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label htmlFor="edit-name">Name</label>
              <input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="edit-email">Email</label>
              <input id="edit-email" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-notes">Notes</label>
              <input id="edit-notes" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Delete Student" onClose={() => setShowDelete(false)}>
          <p>Are you sure you want to delete <strong>{student.name}</strong>? This cannot be undone.</p>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}

      {showReplacement && (
        <Modal title="Set Replacement Class" onClose={() => setShowReplacement(false)}>
          <form onSubmit={handleSetReplacement}>
            <p className="replacement-info">
              Choose an absent date to schedule a replacement class. This will consume 1 credit.
            </p>
            <div className="form-group">
              <label htmlFor="replacement-record">Absent Date</label>
              <select
                id="replacement-record"
                value={selectedAttendanceId || ''}
                onChange={e => setSelectedAttendanceId(Number(e.target.value))}
                required
              >
                <option value="">Select a date...</option>
                {eligibleForReplacement.map(record => (
                  <option key={record.id} value={record.id}>{record.date}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="replacement-date">Replacement Date</label>
              <input
                id="replacement-date"
                type="date"
                value={replacementDate}
                onChange={e => setReplacementDate(e.target.value)}
                required
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowReplacement(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={replacing}>
                {replacing ? 'Setting...' : 'Set Replacement'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEditAttendance && (
        <Modal title="Edit Attendance Record" onClose={() => setShowEditAttendance(null)}>
          <p className="replacement-info">
            Change status for {showEditAttendance.date}. {showEditAttendance.status === 'absent' ? 'Changing to Present will remove 1 credit.' : 'Changing to Absent will add 1 credit.'}
          </p>
          <div className="form-group">
            <label htmlFor="edit-att-status">Status</label>
            <select
              id="edit-att-status"
              value={editAttendanceStatus}
              onChange={e => setEditAttendanceStatus(e.target.value)}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowEditAttendance(null)}>Cancel</button>
            <button className="btn-primary" onClick={() => handleEditAttendance(showEditAttendance)}>Save</button>
          </div>
        </Modal>
      )}

      {showDeleteAttendance && (
        <Modal title="Delete Attendance Record" onClose={() => setShowDeleteAttendance(null)}>
          <p>Are you sure you want to delete the attendance record for <strong>{showDeleteAttendance.date}</strong>?</p>
          {showDeleteAttendance.status === 'absent' && <p className="replacement-info">This will also remove the 1 credit awarded for this absence.</p>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowDeleteAttendance(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDeleteAttendance(showDeleteAttendance)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default StudentProfile;
