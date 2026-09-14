import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentExam, getStudentExamQuestions, startStudentExam, submitStudentAnswer, submitStudentExam } from '../api/client.js';

function StudentExamTake() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [studentExam, setStudentExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const timerRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError('');
      try {
        const examData = await getStudentExam(id);
        if (cancelled) return;
        setExam(examData);
        setStudentExam(examData.student_exam);

        let updated = examData;
        if (!examData.student_exam.started_at) {
          await startStudentExam(id);
          updated = await getStudentExam(id);
          if (cancelled) return;
          setExam(updated);
          setStudentExam(updated.student_exam);
        }

        const qData = await getStudentExamQuestions(id);
        if (cancelled) return;
        setQuestions(qData.questions);
        const currentExam = updated || examData;
        if (currentExam.student_exam.started_at_ms) {
          setStartedAt(currentExam.student_exam.started_at_ms);
        } else if (currentExam.student_exam.started_at) {
          setStartedAt(new Date(currentExam.student_exam.started_at).getTime());
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!startedAt) return;

    const totalSeconds = exam.time_limit_minutes * 60;

    const updateTimer = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, Math.ceil(totalSeconds - elapsed));
      setTimeLeft(remaining);

      if (remaining <= 0 && !submittingRef.current) {
        clearInterval(timerRef.current);
        handleSubmit();
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => clearInterval(timerRef.current);
  }, [startedAt]);

  async function handleSubmit() {
    if (submittingRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const result = await submitStudentExam(id);
      navigate(`/student/exams/${id}/result`);
    } catch (err) {
      setError(err.message);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleAnswer(questionId, option) {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    try {
      await submitStudentAnswer(id, { question_id: questionId, selected_option: option });
    } catch (err) {
      setError(err.message);
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (loading) return <p className="status-text">Loading exam...</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!exam || !studentExam) return <p className="form-error">Exam not available.</p>;

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">{exam.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {timeLeft !== null && (
            <span style={{ fontSize: 18, fontWeight: 600, color: timeLeft < 60 ? 'red' : 'inherit' }}>
              {formatTime(timeLeft)}
            </span>
          )}
          <button className="btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
      {exam.description && <p className="status-text" style={{ marginBottom: 12 }}>{exam.description}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="exam-questions">
        {questions.map((q, idx) => {
          const selected = answers[q.id];
          return (
            <div key={q.id} className="exam-question-card">
              <div className="exam-question-header">
                <span className="exam-question-number">Q{idx + 1}</span>
                <p className="exam-question-text">{q.question_text}</p>
              </div>
              <div className="exam-options">
                {['A', 'B', 'C', 'D'].map(opt => {
                  const label = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }[opt];
                  const isSelected = selected === opt;
                  return (
                    <label
                      key={opt}
                      className={`exam-option ${isSelected ? 'exam-option-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        checked={isSelected}
                        onChange={() => handleAnswer(q.id, opt)}
                      />
                      <span className="exam-option-label">
                        <span className="exam-option-letter">{opt}.</span>
                        <span className="exam-option-text">{label}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StudentExamTake;
