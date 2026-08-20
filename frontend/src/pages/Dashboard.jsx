import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchedulesRange } from '../api/client.js';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function Dashboard() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [schedulesByDate, setSchedulesByDate] = useState({});
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => { loadMonth(); }, [year, month]);

  async function loadMonth() {
    setLoading(true);
    const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const last = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    try {
      const data = await getSchedulesRange(first, last);
      setSchedules(data);
      const byDate = {};
      data.forEach(sc => {
        if (!byDate[sc.date]) byDate[sc.date] = [];
        byDate[sc.date].push(sc);
      });
      setSchedulesByDate(byDate);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`blank-${i}`} className="cal-cell cal-blank" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(d);
    const daySchedules = schedulesByDate[ds] || [];
    const isToday = ds === today;
    const isSelected = selectedDay === ds;
    cells.push(
      <div
        key={d}
        className={`cal-cell cal-day-cell ${daySchedules.length > 0 ? 'cal-has-event' : ''} ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''}`}
        onClick={() => setSelectedDay(isSelected ? null : ds)}
        title={daySchedules.map(s => `${s.time} ${s.class_name}`).join('\n')}
      >
        {d}
        {daySchedules.length > 0 && <span className="cal-dot" />}
      </div>
    );
  }

  const selectedSchedules = selectedDay ? (schedulesByDate[selectedDay] || []) : [];

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-actions">
          <button className="btn-primary btn-sm" onClick={() => navigate('/dashboard')}>Students</button>
          <button className="btn-secondary btn-sm" onClick={() => navigate('/attendance')}>Mark Attendance</button>
          <button className="btn-secondary btn-sm" onClick={() => navigate('/schedule')}>Schedule</button>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="card dashboard-calendar-card">
          <div className="cal-header">
            <button className="cal-nav" onClick={prevMonth}>&lsaquo;</button>
            <span className="cal-title" style={{ fontSize: 16 }}>{MONTHS[month]} {year}</span>
            <button className="cal-nav" onClick={nextMonth}>&rsaquo;</button>
          </div>
          <div className="cal-grid" style={{ gap: 4 }}>
            {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
            {cells}
          </div>
        </div>

        <div className="dashboard-sidebar">
          {loading && <p className="status-text">Loading...</p>}
          {!loading && !selectedDay && (
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <p className="status-text" style={{ fontSize: 15 }}>Click a date to see scheduled classes</p>
            </div>
          )}
          {!loading && selectedDay && (
            <div className="card" style={{ padding: 16 }}>
              <h3 className="section-title">{selectedDay}</h3>
              {selectedSchedules.length === 0 ? (
                <p className="status-text">No classes scheduled</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedSchedules.map(sc => (
                    <div key={sc.id} className="schedule-card-item">
                      <div className="schedule-card-time">{sc.time}</div>
                      <div className="schedule-card-body">
                        <strong>{sc.class_name}</strong>
                        <div className="schedule-card-students">
                          {sc.students.map(s => s.name).join(', ')}
                        </div>
                        {sc.notes && <div className="profile-detail">{sc.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;