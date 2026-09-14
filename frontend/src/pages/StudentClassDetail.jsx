import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentClass } from '../api/client.js';

function StudentClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getStudentClass(id);
      setCls(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="status-text">Loading class...</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!cls) return <p className="form-error">Class not found.</p>;

  return (
    <div>
      <button className="btn-secondary btn-sm" onClick={() => navigate('/student/classes')}>&larr; Back to Classes</button>

      <div className="card profile-header" style={{ marginTop: 12 }}>
        <div className="profile-header-row">
          <h1 className="profile-name">{cls.name}</h1>
        </div>
        {cls.description && <p className="profile-detail">{cls.description}</p>}
      </div>

      <div className="card attendance-section" style={{ marginTop: 12 }}>
        <h2 className="section-title">Chapters</h2>
        {!cls.stages || cls.stages.length === 0 ? (
          <p className="status-text">No chapters defined yet.</p>
        ) : (
          <div className="attendance-table">
            <div className="attendance-table-header" style={{ gridTemplateColumns: '1fr' }}>
              <span>Chapter Name</span>
            </div>
            {cls.stages.map(stage => (
              <div key={stage.id} className="attendance-table-row" style={{ gridTemplateColumns: '1fr' }}>
                <span>{stage.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentClassDetail;
