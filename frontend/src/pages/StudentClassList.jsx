import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentClasses } from '../api/client.js';

function StudentClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getStudentClasses();
      setClasses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <p className="status-text">Loading classes...</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Classes</h1>
      </div>
      {classes.length === 0 ? (
        <p className="status-text">No classes available yet.</p>
      ) : (
        <div className="student-grid">
          {classes.map(cls => (
            <div key={cls.id} className="card student-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/classes/${cls.id}`)}>
              <div className="student-card-header">
                <h3 className="student-card-name">{cls.name}</h3>
              </div>
              {cls.description && <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{cls.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentClassList;
