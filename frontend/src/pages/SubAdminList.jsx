import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import { getSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin } from '../api/client.js';

const PERMISSIONS = [
  { key: 'can_manage_students', label: 'Manage Students & Attendance' },
  { key: 'can_manage_classes', label: 'Manage Classes' },
  { key: 'can_manage_exams', label: 'Manage Exams' },
  { key: 'can_manage_admins', label: 'Manage Sub-Admins' },
];

function SubAdminList() {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '', permissions: {} });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getSubAdmins();
      setSubAdmins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createSubAdmin(form);
      setShowAdd(false);
      setForm({ username: '', password: '', permissions: {} });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateSubAdmin(showEdit.id, form);
      setShowEdit(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this sub-admin?')) return;
    try {
      await deleteSubAdmin(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function openEdit(admin) {
    setShowEdit(admin);
    setForm({
      username: admin.username,
      password: '',
      permissions: admin.permissions || {}
    });
  }

  function togglePermission(key) {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Sub-Admins</h1>
        <button className="btn-primary" onClick={() => { setForm({ username: '', password: '', permissions: {} }); setShowAdd(true); }}>Create Sub-Admin</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="status-text">Loading...</p>}
      {!loading && subAdmins.length === 0 && (
        <p className="status-text">No sub-admins yet.</p>
      )}
      {!loading && subAdmins.length > 0 && (
        <div className="attendance-table">
          <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr 1fr 80px' }}>
            <span>Username</span>
            <span>Permissions</span>
            <span>Actions</span>
          </div>
          {subAdmins.map(a => (
            <div key={a.id} className="attendance-table-row" style={{ gridTemplateColumns: '1fr 1fr 80px' }}>
              <span>{a.username}</span>
              <span>{Object.keys(a.permissions || {}).filter(k => a.permissions[k]).join(', ') || '—'}</span>
              <span className="attendance-row-actions">
                <button className="btn-secondary btn-xs" onClick={() => openEdit(a)}>Edit</button>
                <button className="btn-danger btn-xs" onClick={() => handleDelete(a.id)}>Delete</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Create Sub-Admin" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Username</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required autoFocus />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Permissions</label>
              {PERMISSIONS.map(p => (
                <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={!!form.permissions[p.key]}
                    onChange={() => togglePermission(p.key)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showEdit && (
        <Modal title="Edit Sub-Admin" onClose={() => setShowEdit(null)}>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Username</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>New Password (leave blank to keep current)</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} minLength={6} />
            </div>
            <div className="form-group">
              <label>Permissions</label>
              {PERMISSIONS.map(p => (
                <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={!!form.permissions[p.key]}
                    onChange={() => togglePermission(p.key)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default SubAdminList;
