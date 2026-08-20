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
    (function(dayNum) {
      var ds = dateStr(dayNum);
      var daySchedules = schedulesByDate[ds] || [];
      var isToday = ds === todayStr;
      var isSelected = selectedDay === ds;
      var cls = 'cal-cell cal-day-cell';
      if (daySchedules.length > 0) cls += ' cal-has-event';
      if (isToday) cls += ' cal-today';
      if (isSelected) cls += ' cal-selected';
      cells.push(
        <div key={dayNum} className={cls} onClick={function() { setSelectedDay(isSelected ? null : ds); }}>
          {dayNum}
          {daySchedules.length > 0 && <span className="cal-dot" />}
        </div>
      );
    })(d);
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

  // Horizontal timeline 08:00 - 22:00
  var todaySchedules = schedulesByDate[todayStr] || [];
  var HOURS_START = 8;
  var HOURS_END = 22;
  var HOURS_TOTAL = HOURS_END - HOURS_START;
  var MINUTES_TOTAL = HOURS_TOTAL * 60;

  var hourLabels = [];
  for (var h = HOURS_START; h <= HOURS_END; h++) {
    hourLabels.push(
      <div key={h} className="htimeline-label" style={{ left: ((h - HOURS_START) / HOURS_TOTAL) * 100 + '%' }}>
        {String(h).padStart(2, '0') + ':00'}
      </div>
    );
  }

  var timelineBlocks = [];
  for (var tb = 0; tb < todaySchedules.length; tb++) {
    var ts = todaySchedules[tb];
    var startH = Number((ts.time || '08:00').split(':')[0]);
    var startM = Number((ts.time || '08:00').split(':')[1]);
    var endH = ts.end_time ? Number(ts.end_time.split(':')[0]) : (startH + 1);
    var endM = ts.end_time ? Number(ts.end_time.split(':')[1]) : startM;
    var classStartMin = Math.max((startH * 60 + startM) - HOURS_START * 60, 0);
    var classEndMin = Math.min((endH * 60 + endM) - HOURS_START * 60, MINUTES_TOTAL);
    var leftPct = (classStartMin / MINUTES_TOTAL) * 100;
    var widthPct = Math.max(((classEndMin - classStartMin) / MINUTES_TOTAL) * 100, 1.5);

    timelineBlocks.push(
      <div
        key={ts.id}
        className="htimeline-block"
        style={{ left: leftPct + '%', width: Math.max(widthPct, 1.5) + '%' }}
      >
        <span className="htimeline-block-name">{ts.class_name}</span>
        <span className="htimeline-block-students">{ts.students.map(function(s) { return s.name; }).join(', ')}</span>
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

      <div className="card htimeline-card">
        <h3 className="section-title">Today - {todayStr}</h3>
        <div className="htimeline-wrap">
          <div className="htimeline-nowrap">
            <div className="htimeline-labels">
              {hourLabels}
            </div>
            <div className="htimeline-track">
              {timelineBlocks}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="card dashboard-calendar-card" style={{ padding: 12 }}>
          <div className="cal-header" style={{ marginBottom: 6 }}>
            <button className="cal-nav" onClick={prevMonth}>&lsaquo;</button>
            <span className="cal-title" style={{ fontSize: 14 }}>{MONTHS[month]} {year}</span>
            <button className="cal-nav" onClick={nextMonth}>&rsaquo;</button>
          </div>
          <div className="cal-grid" style={{ gap: 3 }}>
            {DAYS.map(function(d) { return <div key={d} className="cal-day-label" style={{ fontSize: 9, padding: '2px 0' }}>{d}</div>; })}
            {cells}
          </div>
        </div>

        <div className="dashboard-sidebar" style={{ width: 300 }}>
          {!loading && !selectedDay && (
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <p className="status-text" style={{ fontSize: 14 }}>Click a date to see scheduled classes</p>
            </div>
          )}
          {!loading && selectedDay && (
            <div className="card" style={{ padding: 14 }}>
              <h3 className="section-title" style={{ fontSize: 15, marginBottom: 8 }}>{selectedDay}</h3>
              {sidebarCards.length === 0 ? (<p className="status-text">No classes scheduled</p>) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{sidebarCards}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;