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
    const pad = n => String(n).padStart(2, '0');
    const first = year + '-' + pad(month + 1) + '-01';
    const lastDay = new Date(year, month + 1, 0).getDate();
    const last = year + '-' + pad(month + 1) + '-' + pad(lastDay);
    try {
      const data = await getSchedulesRange(first, last);
      setSchedules(data);
      const byDate = {};
      data.forEach(function(sc) {
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
    if (month === 0) { setYear(function(y) { return y - 1; }); setMonth(11); }
    else setMonth(function(m) { return m - 1; });
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(function(y) { return y + 1; }); setMonth(0); }
    else setMonth(function(m) { return m + 1; });
    setSelectedDay(null);
  }

  function dateStr(d) {
    return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={'blank-' + i} className="cal-cell cal-blank" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(d);
    const daySchedules = schedulesByDate[ds] || [];
    const isToday = ds === today;
    const isSelected = selectedDay === ds;
    let cls = 'cal-cell cal-day-cell';
    if (daySchedules.length > 0) cls += ' cal-has-event';
    if (isToday) cls += ' cal-today';
    if (isSelected) cls += ' cal-selected';
    cells.push(
      <div
        key={d}
        className={cls}
        onClick={function() { setSelectedDay(isSelected ? null : ds); }}
      >
        {d}
        {daySchedules.length > 0 && <span className="cal-dot" />}
      </div>
    );
  }

  const selectedSchedules = selectedDay ? (schedulesByDate[selectedDay] || []) : [];

  const sidebarCards = [];
  for (const sc of selectedSchedules) {
    const partsStart = (sc.time || '').split(':');
    const partsEnd = (sc.end_time || '').split(':');
    let durStr = '';
    if (sc.time && sc.end_time) {
      const min = (Number(partsEnd[0]) * 60 + Number(partsEnd[1])) - (Number(partsStart[0]) * 60 + Number(partsStart[1]));
      if (min > 0) {
        durStr = ' (' + Math.floor(min / 60) + 'h';
        if (min % 60 > 0) durStr += min % 60 + 'm';
        durStr += ')';
      }
    }
    sidebarCards.push(
      <div key={sc.id} className="schedule-card-item">
        <div className="schedule-card-time">{sc.time}</div>
        <div className="schedule-card-body">
          <strong>{sc.class_name}</strong>
          <div className="schedule-card-duration">
            {sc.time}{sc.end_time ? ' - ' + sc.end_time : ''}{durStr}
          </div>
          <div className="schedule-card-students">
            {sc.students.map(function(s) { return s.name; }).join(', ')}
          </div>
          {sc.notes && <div className="profile-detail">{sc.notes}</div>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-actions">
          <button className="btn-primary btn-sm" onClick={function() { navigate('/dashboard'); }}>Students</button>
          <button className="btn-secondary btn-sm" onClick={function() { navigate('/attendance'); }}>Mark Attendance</button>
          <button className="btn-secondary btn-sm" onClick={function() { navigate('/schedule'); }}>Schedule</button>
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
            {DAYS.map(function(d) { return <div key={d} className="cal-day-label">{d}</div>; })}
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
              {sidebarCards.length === 0 ? (
                <p className="status-text">No classes scheduled</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sidebarCards}
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