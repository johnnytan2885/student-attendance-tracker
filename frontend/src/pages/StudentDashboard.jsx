import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import { getStudentProfile, getMyStudentAttendance } from '../api/client.js';
import { formatTime24to12, formatDate } from '../utils.js';

function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [profileData, attendanceData] = await Promise.all([
        getStudentProfile(),
        getMyStudentAttendance()
      ]);
      setProfile(profileData);
      setAttendance(attendanceData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) return <p className="status-text">Loading profile...</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!profile) return <p className="form-error">Profile not found.</p>;

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Profile</h1>
      </div>
      {error && <p className="form-error">{error}</p>}

      <div className="card profile-header" style={{ marginTop: 12 }}>
        <div className="profile-header-row">
          <div className="profile-id">
            <Avatar seed={profile.avatar_seed} size={64} />
            <h1 className="profile-name">{profile.name}</h1>
          </div>
        </div>
        {profile.email && <p className="profile-detail">Email: {profile.email}</p>}
        {profile.notes && <p className="profile-detail">Notes: {profile.notes}</p>}

        {profile.classes && profile.classes.length > 0 && (
          <div className="profile-classes">
            <p className="profile-detail" style={{ fontWeight: 600, marginTop: 12 }}>Classes:</p>
            {profile.classes.map(cls => (
              <div key={cls.id} className="profile-class-row">
                <Link to={`/student/classes/${cls.id}`} className="class-link">{cls.name}</Link>
                {cls.stage_name && <span className="inactive-label" style={{ marginLeft: 8 }}>{cls.stage_name}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card attendance-section" style={{ marginTop: 12 }}>
        <h2 className="section-title">Attendance History</h2>
        {attendance.length === 0 ? (
          <p className="status-text">No attendance records yet.</p>
        ) : (
          <div className="attendance-table">
            <div className="attendance-table-header" style={{ gridTemplateColumns: '90px 90px 1fr 1fr 100px' }}>
              <span>Date</span>
              <span>S / E</span>
              <span>Status</span>
              <span>Class</span>
              <span>Replacement</span>
            </div>
            {attendance.map(record => (
              <div
                key={record.id}
                className={`attendance-table-row ${record.status === 'absent' ? 'row-absent' : 'row-present'}`}
                style={{ gridTemplateColumns: '90px 90px 1fr 1fr 100px' }}
              >
                <span>{formatDate(record.date)}</span>
                <span>{record.time ? formatTime24to12(record.time) + (record.end_time ? '/' + formatTime24to12(record.end_time) : '') : '—'}</span>
                <span>{record.status === 'present' ? 'Present' : 'Absent'}</span>
                <span>{record.class_name || '—'}</span>
                <span>{record.replacement_date ? formatDate(record.replacement_date) : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card attendance-section" style={{ marginTop: 12 }}>
        <h2 className="section-title">Exam History</h2>
        <p className="status-text" style={{ marginBottom: 12 }}>
          <button className="btn-primary btn-sm" onClick={() => navigate('/student/exams')}>View My Exams</button>
        </p>
      </div>
    </div>
  );
}

export default StudentDashboard;
