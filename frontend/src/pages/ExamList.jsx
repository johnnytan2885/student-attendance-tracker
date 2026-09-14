import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import { getExams, createExam, deleteExam, hasPermission } from '../api/client.js';

function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addTime, setAddTime] = useState('30');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getExams();
      setExams(data);
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
      const exam = await createExam({ title: addTitle, description: addDesc || null, time_limit_minutes: Number(addTime) });
      setExams(prev => [exam, ...prev]);
      setShowAdd(false);
      setAddTitle('');
      setAddDesc('');
      setAddTime('30');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this exam? This will also remove its questions and student results.')) return;
    try {
      await deleteExam(id);
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Exams</h1>
        {hasPermission('can_manage_exams') && <button className="btn-primary" onClick={() => setShowAdd(true)}>Create Exam</button>}
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="status-text">Loading exams...</p>}
      {!loading && exams.length === 0 && (
        <p className="status-text">No exams yet. Create your first exam above.</p>
      )}
      <div className="student-grid">
        {exams.map(exam => (
          <div key={exam.id} className="card student-card">
            <div className="student-card-header" onClick={() => navigate(`/exams/${exam.id}`)}>
              <div>
                <h3 className="student-card-name">{exam.title}</h3>
                <span className="status-text" style={{ display: 'block', marginTop: 4 }}>
                  {exam.time_limit_minutes} min · {exam.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <p className="status-text" style={{ fontSize: 13 }}>{exam.description || 'No description'}</p>
            <div className="student-card-actions">
              <button className="btn-secondary btn-sm" onClick={() => navigate(`/exams/${exam.id}`)}>Manage</button>
              {hasPermission('can_manage_exams') && <button className="btn-danger btn-sm" onClick={() => handleDelete(exam.id)}>Delete</button>}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title="Create Exam" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input id="title" value={addTitle} onChange={e => setAddTitle(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="desc">Description</label>
              <textarea id="desc" value={addDesc} onChange={e => setAddDesc(e.target.value)} rows={3} />
            </div>
            <div className="form-group">
              <label htmlFor="time">Time Limit (minutes)</label>
              <input id="time" type="number" min="1" value={addTime} onChange={e => setAddTime(e.target.value)} required />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default ExamList;
