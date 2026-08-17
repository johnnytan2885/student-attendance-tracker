import { useState, useEffect } from 'react';
import Modal from '../components/Modal.jsx';
import StudentCard from '../components/StudentCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getStudents, createStudent } from '../api/client.js';

function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadStudents() {
    setLoading(true);
    setError('');
    try {
      const data = await getStudents(showArchived);
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStudents(); }, [showArchived]);

  function handleUpdated(updated) {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  function handleDeleted(id) {
    setStudents(prev => prev.filter(s => s.id !== id));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const student = await createStudent({ name: addName, email: addEmail || null, notes: addNotes || null });
      setStudents(prev => [...prev, student]);
      setShowAdd(false);
      setAddName('');
      setAddEmail('');
      setAddNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Students</h1>
        <div className="dashboard-actions">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>Add Student</button>
        </div>
      </div>

      {loading && <p className="status-text">Loading students...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && students.length === 0 && (
        <EmptyState
          message={showArchived ? 'No students found.' : 'No students yet.'}
          actionLabel={showArchived ? undefined : 'Add your first student'}
          onAction={showArchived ? undefined : () => setShowAdd(true)}
        />
      )}

      <div className="student-grid">
        {students.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ))}
      </div>

      {showAdd && (
        <Modal title="Add Student" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label htmlFor="add-name">Name *</label>
              <input id="add-name" value={addName} onChange={e => setAddName(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="add-email">Email</label>
              <input id="add-email" type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="add-notes">Notes</label>
              <input id="add-notes" value={addNotes} onChange={e => setAddNotes(e.target.value)} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;