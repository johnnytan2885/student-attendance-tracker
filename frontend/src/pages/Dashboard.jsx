import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchedulesRange } from '../api/client.js';

var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function Dashboard() {
  var navigate = useNavigate();
  var [schedules, setSchedules] = useState([]);
  var [schedulesByDate, setSchedulesByDate] = useState({});
  var [year, setYear] = useState(new Date().getFullYear());
  var [month, setMonth] = useState(new Date().getMonth());
  var [loading, setLoading] = useState(true);
  var [selectedDay, setSelectedDay] = useState(null);

  useEffect(function() { loadMonth(); }, [year, month]);

  async function loadMonth() {
    setLoading(true);
    var pad = function(n) { return String(n).padStart(2, '0'); };
    var first = year + '-' + pad(month + 1) + '-01';
    var lastDay = new Date(year, month + 1, 0).getDate();
    var last = year + '-' + pad(month + 1) + '-' + pad(lastDay);
    try {
      var data = await getSchedulesRange(first, last);
      setSchedules(data);
      var byDate = {};
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

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var todayStr = new Date().toISOString().slice(0, 10);

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

  var cells = [];
  for (var i = 0; i < firstDay; i++) cells.push(<div key={'blank-' + i} className="cal-cell cal-blank" />);
  for (var d = 1; d <= daysInMonth; d++) {
    var ds = dateStr(d);
    var daySchedules = schedulesByDate[ds] || [];
    var isToday = ds === todayStr;
    var isSelected = selectedDay === ds;
    var cls = 'cal-cell cal-day-cell';
    if (daySchedules.length > 0) cls += ' cal-has-event';
    if (isToday) cls += ' cal-today';
    if (isSelected) cls += ' cal-selected';
    cells.push(
      <div key={d} className={cls} onClick={function() { setSelectedDay(isSelected ? null : ds); }}>
        {d}
        {daySchedules.length > 0 && <span className="cal-dot" />}
      </div>
    );
  }

  var selectedSchedules = selectedDay ? (schedulesByDate[selectedDay] || []) : [];

  var sidebarCards = [];
  for (var si = 0; si < selectedSchedules.length; si++) {
    var sc = selectedSchedules[si];
    var partsStart = (sc.time || '').split(':');
    var partsEnd = (sc.end_time || '').split(':');
    var durStr = '';
    if (sc.time && sc.end_time) {
      var min = (Number(partsEnd[0]) * 60 + Number(partsEnd[1])) - (Number(partsStart[0]) * 60 + Number(partsStart[1]));
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
          <div className="schedule-card-duration">{sc.time}{sc.end_time ? ' - ' + sc.end_time : ''}{durStr}</div>
          <div className="schedule-card-students">{sc.students.map(function(s) { return s.name; }).join(', ')}</div>
          {sc.notes && <div className="profile-detail">{sc.notes}</div>}
        </div>
      </div>
    );
  }

  // Build today's timeline
  var todaySchedules = schedulesByDate[todayStr] || [];
  var hourlySlots = [];
  for (var h = 0; h < 24; h++) {
    var hourLabel = String(h).padStart(2, '0') + ':00';
    var blocksInHour = [];

    for (var ti = 0; ti < todaySchedules.length; ti++) {
      var ts = todaySchedules[ti];
      var startH = Number((ts.time || '00:00').split(':')[0]);
      var startM = Number((ts.time || '00:00').split(':')[1]);
      var endH = ts.end_time ? Number(ts.end_time.split(':')[0]) : (startH + 1);
      var endM = ts.end_time ? Number(ts.end_time.split(':')[1]) : startM;

      // Check if this class overlaps with this hour slot
      var slotStart = h * 60;
      var slotEnd = (h + 1) * 60;
      var classStart = startH * 60 + startM;
      var classEnd = endH * 60 + endM;

      if (classStart < slotEnd && classEnd > slotStart) {
        blocksInHour.push(ts);
      }
    }

    hourlySlots.push(
      <div key={h} className="timeline-hour">
        <div className="timeline-label">{hourLabel}</div>
        <div className="timeline-track">
          {blocksInHour.length === 0 && <div className="timeline-empty" />}
          {blocksInHour.map(function(sched) {
            var sH = Number((sched.time || '00:00').split(':')[0]);
            var sM = Number((sched.time || '00:00').split(':')[1]);
            var eH = sched.end_time ? Number(sched.end_time.split(':')[0]) : (sH + 1);
            var eM = sched.end_time ? Number(sched.end_time.split(':')[1]) : sM;
            var totalStart = sH * 60 + sM;
            var totalEnd = eH * 60 + eM;
            var slotStartMin = h * 60;
            var slotEndMin = (h + 1) * 60;
            var overlapStart = Math.max(totalStart, slotStartMin);
            var overlapEnd = Math.min(totalEnd, slotEndMin);
            var overlapMinutes = overlapEnd - overlapStart;
            var percent = (overlapMinutes / 60) * 100;
            var offsetMin = overlapStart - slotStartMin;
            var offsetPercent = (offsetMin / 60) * 100;

            return (
              <div
                key={sched.id}
                className="timeline-block"
                style={{
                  left: offsetPercent + '%',
                  width: percent + '%'
                }}
                title={sched.class_name + ': ' + sched.students.map(function(s) { return s.name; }).join(', ')}
              >
                <span className="timeline-block-text">{sched.class_name}</span>
                <span className="timeline-block-students">{sched.students.map(function(s) { return s.name; }).join(', ')}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-actions">
          <button className="btn-primary btn-sm" onClick={function() { navigate('/students'); }}>Students</button>
          <button className="btn-secondary btn-sm" onClick={function() { navigate('/attendance'); }}>Mark Attendance</button>
          <button className="btn-secondary btn-sm" onClick={function() { navigate('/schedule'); }}>Schedule</button>
        </div>
      </div>

      <div className="card timeline-card">
        <h3 className="section-title">Today - {todayStr}</h3>
        <div className="timeline-container">
          {hourlySlots}
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
          {!loading && !selectedDay && (
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <p className="status-text" style={{ fontSize: 15 }}>Click a date to see scheduled classes</p>
            </div>
          )}
          {!loading && selectedDay && (
            <div className="card" style={{ padding: 16 }}>
              <h3 className="section-title">{selectedDay}</h3>
              {sidebarCards.length === 0 ? (<p className="status-text">No classes scheduled</p>) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{sidebarCards}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;