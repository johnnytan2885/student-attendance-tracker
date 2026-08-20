import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import { getClasses, createClass, deleteClass } from '../api/client.js';

function ClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getClasses(false);
      setClasses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const cls = await createClass({ name: addName, description: addDesc || null });
      setClasses(prev => [...prev, cls]);
      setShowAdd(false);
      setAddName('');
      setAddDesc('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteClass(id);
      setClasses(prev => prev.filter(c => c.id !== id));
      setShowDelete(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Classes</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>Add Class</button>
      </div>

      {loading && <p className="status-text">Loading classes...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && classes.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-message">No classes yet.</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>Create your first class</button>
        </div>
      )}

      <div className="student-grid">
        {classes.map(cls => (
          <div key={cls.id} className="card student-card" style={{ cursor: 'pointer' }}>
            <div className="student-card-header" onClick={() => navigate(`/classes/${cls.id}`)}>
              <h3 className="student-card-name">{cls.name}</h3>
            </div>
            {cls.description && <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{cls.description}</p>}
            <div className="student-card-actions">
              <button className="btn-danger btn-sm" onClick={e => { e.stopPropagation(); setShowDelete(cls.id); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title="Add Class" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label htmlFor="add-name">Name *</label>
              <input id="add-name" value={addName} onChange={e => setAddName(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="add-desc">Description</label>
              <textarea id="add-desc" value={addDesc} onChange={e => setAddDesc(e.target.value)} rows={3} style={{ width: '100%', fontFamily: 'inherit', fontSize: 16, padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Delete Class" onClose={() => setShowDelete(null)}>
          <p>Are you sure you want to delete this class? This cannot be undone.</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDelete(showDelete)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ClassList;