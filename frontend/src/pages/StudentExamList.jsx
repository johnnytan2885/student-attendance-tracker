import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentAvailableExams, getStudentExamHistory } from '../api/client.js';

function StudentExamList() {
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timers, setTimers] = useState({});
  const navigate = useNavigate();
  const timerRef = useRef(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [examsData, historyData] = await Promise.all([
        getStudentAvailableExams(),
        getStudentExamHistory()
      ]);
      setExams(examsData);
      setHistory(historyData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const inProgress = exams.filter(e => e.started_at && !e.submitted_at);
    if (inProgress.length === 0) return;

    const updateTimers = () => {
      setTimers(prev => {
        const next = { ...prev };
        for (const exam of inProgress) {
          let started;
          if (exam.started_at_ms) {
            started = exam.started_at_ms;
          } else if (exam.started_at) {
            started = new Date(exam.started_at).getTime();
          } else {
            continue;
          }
          const totalMs = exam.time_limit_minutes * 60 * 1000;
          const elapsed = Date.now() - started;
          const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
          next[exam.id] = remaining;
        }
        return next;
      });
    };

    updateTimers();
    timerRef.current = setInterval(updateTimers, 1000);

    return () => clearInterval(timerRef.current);
  }, [exams]);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Exams</h1>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="status-text">Loading exams...</p>}

      {!loading && exams.length === 0 && history.length === 0 && (
        <p className="status-text">No exams available.</p>
      )}

      {exams.length > 0 && (
        <div className="student-grid" style={{ marginBottom: 24 }}>
          {exams.map(exam => (
            <div key={exam.id} className="card student-card">
              <div className="student-card-header" onClick={() => navigate(`/student/exams/${exam.id}`)}>
                <div>
                  <h3 className="student-card-name">{exam.title}</h3>
                  <span className="status-text" style={{ display: 'block', marginTop: 4 }}>
                    {exam.time_limit_minutes} min · {exam.submitted_at ? 'Submitted' : exam.started_at ? 'In Progress' : 'Not Started'}
                  </span>
                  {exam.started_at && !exam.submitted_at && timers[exam.id] !== undefined && (
                    <span className="status-text" style={{ display: 'block', marginTop: 2, fontWeight: 600, color: (timers[exam.id] || 0) < 60 ? 'var(--color-danger)' : 'inherit' }}>
                      Time left: {formatTime(timers[exam.id] || 0)}
                    </span>
                  )}
                </div>
              </div>
              <p className="status-text" style={{ fontSize: 13 }}>{exam.description || 'No description'}</p>
              <div className="student-card-actions">
                {!exam.started_at && <button className="btn-primary btn-sm" onClick={() => navigate(`/student/exams/${exam.id}`)}>Start Exam</button>}
                {exam.started_at && !exam.submitted_at && <button className="btn-primary btn-sm" onClick={() => navigate(`/student/exams/${exam.id}`)}>Continue</button>}
                {exam.submitted_at && (
                  <button className="btn-secondary btn-sm" onClick={() => navigate(`/student/exams/${exam.id}/result`)}>
                    View Result ({exam.score}/{exam.total_questions})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="card attendance-section">
          <h2 className="section-title">Exam History</h2>
          <div className="attendance-table">
              <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr 1fr 120px 120px' }}>
                <span>Exam</span>
                <span>Submitted</span>
                <span>Score</span>
                <span>Action</span>
              </div>
              {history.map(h => {
                const pct = h.total_questions > 0 ? Math.round((h.score / h.total_questions) * 100) : 0;
                return (
                  <div key={h.id} className="attendance-table-row" style={{ gridTemplateColumns: '1fr 1fr 120px 120px' }}>
                    <span>{h.title}</span>
                    <span>{h.submitted_at ? new Date(h.submitted_at).toLocaleString() : '—'}</span>
                    <span>{h.score} / {h.total_questions} ({pct}%)</span>
                    <span><button className="btn-secondary btn-xs" onClick={() => navigate(`/student/exams/${h.exam_id}/result`)}>View</button></span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentExamList;
