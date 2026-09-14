import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import { getExam, updateExam, addQuestion, updateQuestion, deleteQuestion, allocateExam, getExamAllocated, getStudents, resetStudentExam, hasPermission } from '../api/client.js';

function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allocated, setAllocated] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAddQ, setShowAddQ] = useState(false);
  const [showEditQ, setShowEditQ] = useState(null);
  const [showAlloc, setShowAlloc] = useState(false);
  const [qForm, setQForm] = useState({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' });
  const [allocIds, setAllocIds] = useState([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [examData, allocData, studentsData] = await Promise.all([
        getExam(id),
        getExamAllocated(id),
        getStudents(false)
      ]);
      setExam(examData);
      setAllocated(allocData);
      setStudents(studentsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const canManageExams = hasPermission('can_manage_exams');

  async function handleUpdateExam(e) {
    e.preventDefault();
    const form = e.target;
    setSaving(true);
    setError('');
    try {
      const updated = await updateExam(id, {
        title: form.title.value,
        description: form.description.value || null,
        time_limit_minutes: Number(form.time.value),
        active: form.active.checked ? 1 : 0
      });
      setExam(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddQuestion(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const q = await addQuestion(id, qForm);
      setExam(prev => ({ ...prev, questions: [...(prev.questions || []), q] }));
      setShowAddQ(false);
      setQForm({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditQuestion(e) {
    e.preventDefault();
    const form = e.target;
    setSaving(true);
    setError('');
    try {
      const updated = await updateQuestion(showEditQ.id, {
        question_text: form.question_text.value,
        option_a: form.option_a.value,
        option_b: form.option_b.value,
        option_c: form.option_c.value,
        option_d: form.option_d.value,
        correct_option: form.correct_option.value
      });
      setExam(prev => ({ ...prev, questions: prev.questions.map(q => q.id === updated.id ? updated : q) }));
      setShowEditQ(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuestion(qId) {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion(qId);
      setExam(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== qId) }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAllocate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await allocateExam(id, allocIds);
      setShowAlloc(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetExam(studentId) {
    if (!confirm('Reset this student\'s exam? They will be able to retake the exam.')) return;
    setSaving(true);
    setError('');
    try {
      await resetStudentExam(id, studentId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="status-text">Loading exam...</p>;
  if (!exam) return <p className="form-error">Exam not found.</p>;

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn-secondary btn-sm" onClick={() => navigate('/exams')}>&larr; Back to Exams</button>

      <div className="card profile-header" style={{ marginTop: 12 }}>
        {canManageExams ? (
          <form onSubmit={handleUpdateExam}>
            <div className="profile-header-row">
              <h1 className="profile-name" style={{ flex: 1 }}>
                <input name="title" defaultValue={exam.title} style={{ fontSize: 24, fontWeight: 600, border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 8px', width: '100%' }} />
              </h1>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                <input type="checkbox" name="active" defaultChecked={exam.active === 1} /> Active
              </label>
            </div>
            <textarea name="description" defaultValue={exam.description || ''} rows={2} style={{ width: '100%', marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 4, padding: 4 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 14 }}>Time limit (min):</label>
              <input name="time" type="number" min="1" defaultValue={exam.time_limit_minutes} style={{ width: 80, border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 8px' }} />
              <button type="submit" className="btn-primary btn-sm" disabled={saving}>Save</button>
            </div>
          </form>
        ) : (
          <div>
            <div className="profile-header-row">
              <h1 className="profile-name">{exam.title}</h1>
              <span className={`inactive-label ${exam.active === 1 ? '' : 'inactive'}`}>{exam.active === 1 ? 'Active' : 'Inactive'}</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>{exam.description || ''}</p>
            <p style={{ fontSize: 14, marginTop: 4 }}>Time limit: {exam.time_limit_minutes} min</p>
          </div>
        )}
      </div>

      <div className="card attendance-section" style={{ marginTop: 12 }}>
        <div className="dashboard-header" style={{ marginBottom: 8 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Questions</h2>
          {canManageExams && <button className="btn-primary btn-sm" onClick={() => setShowAddQ(true)}>Add Question</button>}
        </div>
        {(!exam.questions || exam.questions.length === 0) ? (
          <p className="status-text">No questions yet.</p>
        ) : (
          <div className="attendance-table">
            <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr 80px' }}>
              <span>Question</span>
              <span>Actions</span>
            </div>
            {exam.questions.map((q, idx) => (
              <div key={q.id} className="attendance-table-row" style={{ gridTemplateColumns: '1fr 80px' }}>
                <div>
                  <strong>Q{idx + 1}.</strong> {q.question_text}
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    A: {q.option_a} | B: {q.option_b} | C: {q.option_c} | D: {q.option_d}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-warning)' }}>Correct: {q.correct_option}</div>
                </div>
                <span className="attendance-row-actions">
                  {canManageExams && (
                    <>
                      <button className="btn-secondary btn-xs" onClick={() => setShowEditQ(q)}>Edit</button>
                      <button className="btn-danger btn-xs" onClick={() => handleDeleteQuestion(q.id)}>Del</button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card attendance-section" style={{ marginTop: 12 }}>
        <div className="dashboard-header" style={{ marginBottom: 8 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Allocated Students</h2>
          {canManageExams && <button className="btn-primary btn-sm" onClick={() => setShowAlloc(true)}>Allocate</button>}
        </div>
        {allocated.length === 0 ? (
          <p className="status-text">No students allocated yet.</p>
        ) : (
          <div className="attendance-table">
            <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr 1fr 120px 80px' }}>
              <span>Name</span>
              <span>Email</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {allocated.map(a => (
              <div key={a.id} className="attendance-table-row" style={{ gridTemplateColumns: '1fr 1fr 120px' }}>
                <span>{a.name}</span>
                <span>{a.email}</span>
                <span>{a.submitted_at ? `Submitted (${a.score}/${a.total_questions})` : a.started_at ? 'In Progress' : 'Not Started'}</span>
                <span className="attendance-row-actions">
                  {canManageExams && <button className="btn-danger btn-xs" onClick={() => handleResetExam(a.student_id)}>Reset</button>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddQ && (
        <Modal title="Add Question" onClose={() => setShowAddQ(false)}>
          <form onSubmit={handleAddQuestion}>
            <div className="form-group">
              <label>Question</label>
              <textarea value={qForm.question_text} onChange={e => setQForm({ ...qForm, question_text: e.target.value })} required rows={3} />
            </div>
            <div className="form-group">
              <label>Option A</label>
              <input value={qForm.option_a} onChange={e => setQForm({ ...qForm, option_a: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Option B</label>
              <input value={qForm.option_b} onChange={e => setQForm({ ...qForm, option_b: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Option C</label>
              <input value={qForm.option_c} onChange={e => setQForm({ ...qForm, option_c: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Option D</label>
              <input value={qForm.option_d} onChange={e => setQForm({ ...qForm, option_d: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Correct Option</label>
              <select value={qForm.correct_option} onChange={e => setQForm({ ...qForm, correct_option: e.target.value })}>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAddQ(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showEditQ && (
        <Modal title="Edit Question" onClose={() => setShowEditQ(null)}>
          <form onSubmit={handleEditQuestion}>
            <div className="form-group">
              <label>Question</label>
              <textarea name="question_text" defaultValue={showEditQ.question_text} required rows={3} />
            </div>
            <div className="form-group">
              <label>Option A</label>
              <input name="option_a" defaultValue={showEditQ.option_a} required />
            </div>
            <div className="form-group">
              <label>Option B</label>
              <input name="option_b" defaultValue={showEditQ.option_b} required />
            </div>
            <div className="form-group">
              <label>Option C</label>
              <input name="option_c" defaultValue={showEditQ.option_c} required />
            </div>
            <div className="form-group">
              <label>Option D</label>
              <input name="option_d" defaultValue={showEditQ.option_d} required />
            </div>
            <div className="form-group">
              <label>Correct Option</label>
              <select name="correct_option" defaultValue={showEditQ.correct_option}>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowEditQ(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showAlloc && (
        <Modal title="Allocate Exam to Students" onClose={() => setShowAlloc(false)}>
          <form onSubmit={handleAllocate}>
            <p className="status-text" style={{ marginBottom: 8 }}>Select students to allocate this exam to:</p>
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 4, padding: 8 }}>
              {students.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <input
                    type="checkbox"
                    checked={allocIds.includes(s.id)}
                    onChange={e => {
                      if (e.target.checked) setAllocIds([...allocIds, s.id]);
                      else setAllocIds(allocIds.filter(x => x !== s.id));
                    }}
                  />
                  {s.name} ({s.email})
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowAlloc(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Allocating...' : 'Allocate'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default ExamDetail;
