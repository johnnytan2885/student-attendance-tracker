import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import { getClass, createStage, updateStage, deleteStage, getAvailableStudents, assignStudent, removeStudent, setStudentStage, hasPermission } from '../api/client.js';

function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chapter management
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [addChapterName, setAddChapterName] = useState('');
  const [editChapter, setEditChapter] = useState(null);
  const [editChapterName, setEditChapterName] = useState('');
  const [deleteChapterId, setDeleteChapterId] = useState(null);

  // Student management
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Change chapter for a student
  const [changeChapterStudent, setChangeChapterStudent] = useState(null);
  const [changeChapterId, setChangeChapterId] = useState('');

  useEffect(() => { load(); }, [id]);

  const canManageClasses = hasPermission('can_manage_classes');

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

  async function handleAddChapter(e) {
    e.preventDefault();
    try {
      const chapter = await createStage(id, addChapterName);
      setCls(prev => ({ ...prev, stages: [...prev.stages, chapter] }));
      setShowAddChapter(false);
      setAddChapterName('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEditChapter(e) {
    e.preventDefault();
    try {
      const updated = await updateStage(editChapter, editChapterName);
      setCls(prev => ({ ...prev, stages: prev.stages.map(s => s.id === editChapter ? updated : s) }));
      setEditChapter(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteChapter(chapterId) {
    try {
      await deleteStage(chapterId);
      setCls(prev => ({
        ...prev,
        stages: prev.stages.filter(s => s.id !== chapterId),
        students: prev.students.map(s => s.stage_id === chapterId ? { ...s, stage_id: null, stage_name: null } : s)
      }));
      setDeleteChapterId(null);
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

  async function handleSetChapter(studentId) {
    try {
      await setStudentStage(id, studentId, changeChapterId || null);
      const chapter = cls.stages.find(s => s.id === Number(changeChapterId));
      setCls(prev => ({
        ...prev,
        students: prev.students.map(s => s.id === studentId ? { ...s, stage_id: changeChapterId || null, stage_name: chapter?.name || null } : s)
      }));
      setChangeChapterStudent(null);
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

      {/* Chapters Section */}
      <div className="card attendance-section">
        <div className="dashboard-header" style={{ marginBottom: 8 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Chapters</h2>
          {canManageClasses && <button className="btn-primary btn-sm" onClick={() => setShowAddChapter(true)}>Add Chapter</button>}
        </div>
        {cls.stages.length === 0 ? (
          <p className="status-text">No chapters defined yet.</p>
        ) : (
          <div className="attendance-table">
            <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr 80px' }}>
              <span>Chapter Name</span>
              <span>Actions</span>
            </div>
            {cls.stages.map(chapter => (
              <div key={chapter.id} className="attendance-table-row" style={{ gridTemplateColumns: '1fr 80px' }}>
                <span>{chapter.name}</span>
                <span className="attendance-row-actions">
                  {canManageClasses && (
                    <>
                      <button className="btn-secondary btn-xs" onClick={() => { setEditChapter(chapter.id); setEditChapterName(chapter.name); }}>Edit</button>
                      <button className="btn-danger btn-xs" onClick={() => setDeleteChapterId(chapter.id)}>Del</button>
                    </>
                  )}
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
          {canManageClasses && <button className="btn-primary btn-sm" onClick={handleOpenAddStudent}>Add Student</button>}
        </div>
        {cls.students.length === 0 ? (
          <p className="status-text">No students assigned to this class.</p>
        ) : (
          <div className="attendance-table">
            <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr 1fr 120px' }}>
              <span>Name</span>
              <span>Chapter</span>
              <span>Actions</span>
            </div>
            {cls.students.map(s => (
              <div key={s.cs_id} className="attendance-table-row" style={{ gridTemplateColumns: '1fr 1fr 120px' }}>
                <span>{s.name}</span>
                <span>{s.stage_name || '—'}</span>
                <span className="attendance-row-actions">
                  {canManageClasses && (
                    <>
                      <button className="btn-secondary btn-xs" onClick={() => { setChangeChapterStudent(s.id); setChangeChapterId(s.stage_id || ''); }}>
                        {cls.stages.length > 0 ? 'Chapter' : '—'}
                      </button>
                      <button className="btn-danger btn-xs" onClick={() => handleRemoveStudent(s.id)}>Remove</button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Chapter Modal */}
      {showAddChapter && (
        <Modal title="Add Chapter" onClose={() => setShowAddChapter(false)}>
          <form onSubmit={handleAddChapter}>
            <div className="form-group">
              <label htmlFor="add-chapter">Chapter Name</label>
              <input id="add-chapter" value={addChapterName} onChange={e => setAddChapterName(e.target.value)} required autoFocus />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAddChapter(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Add</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Chapter Modal */}
      {editChapter && (
        <Modal title="Edit Chapter" onClose={() => setEditChapter(null)}>
          <form onSubmit={handleEditChapter}>
            <div className="form-group">
              <label htmlFor="edit-chapter">Chapter Name</label>
              <input id="edit-chapter" value={editChapterName} onChange={e => setEditChapterName(e.target.value)} required autoFocus />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditChapter(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Chapter Modal */}
      {deleteChapterId && (
        <Modal title="Delete Chapter" onClose={() => setDeleteChapterId(null)}>
          <p>Are you sure? Students in this chapter will be unassigned from the chapter.</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setDeleteChapterId(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDeleteChapter(deleteChapterId)}>Delete</button>
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

      {/* Change Chapter Modal */}
      {changeChapterStudent && (
        <Modal title="Change Student Chapter" onClose={() => setChangeChapterStudent(null)}>
          <div className="form-group">
            <label htmlFor="change-chapter">Chapter</label>
            <select id="change-chapter" value={changeChapterId} onChange={e => setChangeChapterId(e.target.value)}>
              <option value="">No chapter</option>
              {cls.stages.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setChangeChapterStudent(null)}>Cancel</button>
            <button className="btn-primary" onClick={() => handleSetChapter(changeChapterStudent)}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ClassDetail;
