import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import { getClass, createStage, updateStage, deleteStage, getAvailableStudents, assignStudent, removeStudent, setStudentStage } from '../api/client.js';

function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stage management
  const [showAddStage, setShowAddStage] = useState(false);
  const [addStageName, setAddStageName] = useState('');
  const [editStage, setEditStage] = useState(null);
  const [editStageName, setEditStageName] = useState('');
  const [deleteStageId, setDeleteStageId] = useState(null);

  // Student management
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Change stage for a student
  const [changeStageStudent, setChangeStageStudent] = useState(null);
  const [changeStageId, setChangeStageId] = useState('');

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getClass(id);
      setCls(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStage(e) {
    e.preventDefault();
    try {
      const stage = await createStage(id, addStageName);
      setCls(prev => ({ ...prev, stages: [...prev.stages, stage] }));
      setShowAddStage(false);
      setAddStageName('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEditStage(e) {
    e.preventDefault();
    try {
      const updated = await updateStage(editStage, editStageName);
      setCls(prev => ({ ...prev, stages: prev.stages.map(s => s.id === editStage ? updated : s) }));
      setEditStage(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteStage(stageId) {
    try {
      await deleteStage(stageId);
      setCls(prev => ({
        ...prev,
        stages: prev.stages.filter(s => s.id !== stageId),
        students: prev.students.map(s => s.stage_id === stageId ? { ...s, stage_id: null, stage_name: null } : s)
      }));
      setDeleteStageId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleOpenAddStudent() {
    try {
      const students = await getAvailableStudents(id);
      setAvailableStudents(students);
      setSelectedStudentId('');
      setShowAddStudent(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAssignStudent(e) {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      await assignStudent(id, Number(selectedStudentId));
      setShowAddStudent(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveStudent(studentId) {
    try {
      await removeStudent(id, studentId);
      setCls(prev => ({ ...prev, students: prev.students.filter(s => s.id !== studentId) }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetStage(studentId) {
    try {
      await setStudentStage(id, studentId, changeStageId || null);
      const stage = cls.stages.find(s => s.id === Number(changeStageId));
      setCls(prev => ({
        ...prev,
        students: prev.students.map(s => s.id === studentId ? { ...s, stage_id: changeStageId || null, stage_name: stage?.name || null } : s)
      }));
      setChangeStageStudent(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="status-text">Loading class...</p>;
  if (!cls) return <p className="form-error">Class not found.</p>;

  return (
    <div className="profile-page">
      {error && <p className="form-error">{error}</p>}
      <button className="btn-secondary btn-sm" onClick={() => navigate('/classes')}>&larr; Back to Classes</button>

      <div className="card profile-header" style={{ marginTop: 12 }}>
        <div className="profile-header-row">
          <h1 className="profile-name">{cls.name}</h1>
        </div>
        {cls.description && <p className="profile-detail">{cls.description}</p>}
      </div>

      {/* Stages Section */}
      <div className="card attendance-section">
        <div className="dashboard-header" style={{ marginBottom: 8 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Stages</h2>
          <button className="btn-primary btn-sm" onClick={() => setShowAddStage(true)}>Add Stage</button>
        </div>
        {cls.stages.length === 0 ? (
          <p className="status-text">No stages defined yet.</p>
        ) : (
          <div className="attendance-table">
            <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr 80px' }}>
              <span>Stage Name</span>
              <span>Actions</span>
            </div>
            {cls.stages.map(stage => (
              <div key={stage.id} className="attendance-table-row" style={{ gridTemplateColumns: '1fr 80px' }}>
                <span>{stage.name}</span>
                <span className="attendance-row-actions">
                  <button className="btn-secondary btn-xs" onClick={() => { setEditStage(stage.id); setEditStageName(stage.name); }}>Edit</button>
                  <button className="btn-danger btn-xs" onClick={() => setDeleteStageId(stage.id)}>Del</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Students Section */}
      <div className="card attendance-section">
        <div className="dashboard-header" style={{ marginBottom: 8 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Students</h2>
          <button className="btn-primary btn-sm" onClick={handleOpenAddStudent}>Add Student</button>
        </div>
        {cls.students.length === 0 ? (
          <p className="status-text">No students assigned to this class.</p>
        ) : (
          <div className="attendance-table">
            <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr 1fr 120px' }}>
              <span>Name</span>
              <span>Stage</span>
              <span>Actions</span>
            </div>
            {cls.students.map(s => (
              <div key={s.cs_id} className="attendance-table-row" style={{ gridTemplateColumns: '1fr 1fr 120px' }}>
                <span>{s.name}</span>
                <span>{s.stage_name || '—'}</span>
                <span className="attendance-row-actions">
                  <button className="btn-secondary btn-xs" onClick={() => { setChangeStageStudent(s.id); setChangeStageId(s.stage_id || ''); }}>
                    {cls.stages.length > 0 ? 'Stage' : '—'}
                  </button>
                  <button className="btn-danger btn-xs" onClick={() => handleRemoveStudent(s.id)}>Remove</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Stage Modal */}
      {showAddStage && (
        <Modal title="Add Stage" onClose={() => setShowAddStage(false)}>
          <form onSubmit={handleAddStage}>
            <div className="form-group">
              <label htmlFor="add-stage">Stage Name</label>
              <input id="add-stage" value={addStageName} onChange={e => setAddStageName(e.target.value)} required autoFocus />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAddStage(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Add</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Stage Modal */}
      {editStage && (
        <Modal title="Edit Stage" onClose={() => setEditStage(null)}>
          <form onSubmit={handleEditStage}>
            <div className="form-group">
              <label htmlFor="edit-stage">Stage Name</label>
              <input id="edit-stage" value={editStageName} onChange={e => setEditStageName(e.target.value)} required autoFocus />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditStage(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Stage Modal */}
      {deleteStageId && (
        <Modal title="Delete Stage" onClose={() => setDeleteStageId(null)}>
          <p>Are you sure? Students in this stage will be unassigned from the stage.</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setDeleteStageId(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDeleteStage(deleteStageId)}>Delete</button>
          </div>
        </Modal>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <Modal title="Add Student to Class" onClose={() => setShowAddStudent(false)}>
          <form onSubmit={handleAssignStudent}>
            <div className="form-group">
              <label htmlFor="add-student">Student</label>
              <select id="add-student" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} required>
                <option value="">Select a student...</option>
                {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {availableStudents.length === 0 && <p className="form-error">No active students available to add.</p>}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAddStudent(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={availableStudents.length === 0}>Add</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Stage Modal */}
      {changeStageStudent && (
        <Modal title="Change Student Stage" onClose={() => setChangeStageStudent(null)}>
          <div className="form-group">
            <label htmlFor="change-stage">Stage</label>
            <select id="change-stage" value={changeStageId} onChange={e => setChangeStageId(e.target.value)}>
              <option value="">No stage</option>
              {cls.stages.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setChangeStageStudent(null)}>Cancel</button>
            <button className="btn-primary" onClick={() => handleSetStage(changeStageStudent)}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ClassDetail;