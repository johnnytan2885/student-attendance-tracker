import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentExamResult } from '../api/client.js';

function StudentExamResult() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const result = await getStudentExamResult(id);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p className="status-text">Loading result...</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <p className="form-error">Result not found.</p>;

  const { exam, student_exam, questions } = data;
  const pct = student_exam.total_questions > 0 ? Math.round((student_exam.score / student_exam.total_questions) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-secondary btn-sm" onClick={() => navigate('/student/exams')}>&larr; Back to Exams</button>
      </div>

      <div className="card profile-header" style={{ marginTop: 12 }}>
        <h1 className="profile-name">{exam.title}</h1>
        <p className="profile-detail">Score: <strong>{student_exam.score} / {student_exam.total_questions}</strong> ({pct}%)</p>
        <p className="profile-detail">Submitted: {new Date(student_exam.submitted_at).toLocaleString()}</p>
      </div>

      <div className="attendance-section" style={{ marginTop: 12 }}>
        <h2 className="section-title">Review</h2>
        {questions.map((q, idx) => (
          <div key={q.id} className={`exam-question-card ${q.is_correct ? 'exam-question-correct' : 'exam-question-wrong'}`}>
            <div className="exam-question-header">
              <span className="exam-question-number">{idx + 1}</span>
              <p className="exam-question-text">{q.question_text}</p>
            </div>
            <div className="exam-options">
              {['A', 'B', 'C', 'D'].map(opt => {
                const label = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }[opt];
                const isSelected = q.selected_option === opt;
                const isCorrect = q.correct_option === opt;
                let optionClass = 'exam-option';
                if (isSelected && isCorrect) optionClass = 'exam-option exam-option-correct';
                else if (isSelected && !isCorrect) optionClass = 'exam-option exam-option-wrong';
                else if (!isSelected && isCorrect) optionClass = 'exam-option exam-option-correct-ghost';

                return (
                  <div key={opt} className={optionClass}>
                    <span className="exam-option-letter">{opt}.</span>
                    <span className="exam-option-text">{label}</span>
                    {isSelected && <span className="exam-option-badge">{isCorrect ? 'Your answer (correct)' : 'Your answer'}</span>}
                    {!isSelected && isCorrect && <span className="exam-option-badge exam-option-badge-correct">Correct answer</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentExamResult;
