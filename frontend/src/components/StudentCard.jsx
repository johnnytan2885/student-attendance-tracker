import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal.jsx';
import { updateStudent, archiveStudent, deleteStudent } from '../api/client.js';

function StudentCard({ student, onUpdated, onDeleted }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editName, setEditName] = useState(student.name);
  const [editEmail, setEditEmail] = useState(student.email || '');
  const [editNotes, setEditNotes] = useState(student.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleEdit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await updateStudent(student.id, { name: editName, email: editEmail || null, notes: editNotes || null });
      onUpdated(updated);
      setShowEdit(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    try {
      const updated = await archiveStudent(student.id);
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    try {
      await deleteStudent(student.id);
      onDeleted(student.id);
      setShowDelete(false);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card student-card">
        <div className="student-card-header" onClick={() => navigate(`/students/${student.id}`)}>
          <h3 className="student-card-name">{student.name}</h3>
          <span className={`credit-badge ${student.credits > 0 ? 'has-credits' : ''}`}>
            {student.credits} credit{student.credits !== 1 ? 's' : ''}
          </span>
        </div>
        {!student.active && <span className="inactive-label">Archived</span>}
        <div className="student-card-actions">
          <button className="btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn-secondary btn-sm" onClick={handleArchive}>
            {student.active ? 'Archive' : 'Unarchive'}
          </button>
          <button className="btn-danger btn-sm" onClick={() => setShowDelete(true)}>Delete</button>
        </div>
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
    </>
  );
}

export default StudentCard;