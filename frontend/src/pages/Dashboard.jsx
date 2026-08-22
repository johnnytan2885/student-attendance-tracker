import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchedulesRange, getAttendanceDates, getAttendanceByDate } from '../api/client.js';
import { formatTime24to12, formatDate, formatDateTimeRange, calcDuration } from '../utils.js';

var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function Dashboard() {
  var navigate = useNavigate();
  var [schedules, setSchedules] = useState([]);
  var [schedulesByDate, setSchedulesByDate] = useState({});
  var [attendanceDates, setAttendanceDates] = useState({});
  var [todayAtt, setTodayAtt] = useState([]);
  var [selectedDayAtt, setSelectedDayAtt] = useState([]);
  var [year, setYear] = useState(new Date().getFullYear());
  var [month, setMonth] = useState(new Date().getMonth());
  var [loading, setLoading] = useState(true);
  var [selectedDay, setSelectedDay] = useState(null);
  var [sidebarLoading, setSidebarLoading] = useState(false);

  useEffect(function() { loadMonth(); }, [year, month]);

  async function loadMonth() {
    setLoading(true);
    var pad = function(n) { return String(n).padStart(2, '0'); };
    var first = year + '-' + pad(month + 1) + '-01';
    var lastDay = new Date(year, month + 1, 0).getDate();
    var last = year + '-' + pad(month + 1) + '-' + pad(lastDay);
    try {
      var [schedData, attDates] = await Promise.all([
        getSchedulesRange(first, last),
        getAttendanceDates(first, last)
      ]);
      setSchedules(schedData);
      var attMap = {};
      attDates.forEach(function(d) { attMap[d] = true; });
      setAttendanceDates(attMap);
      var byDate = {};
      schedData.forEach(function(sc) {
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

  useEffect(function() {
    if (selectedDay) {
      setSidebarLoading(true);
      getAttendanceByDate(selectedDay).then(function(data) {
        setSelectedDayAtt(data);
      }).catch(function() {
        setSelectedDayAtt([]);
      }).finally(function() {
        setSidebarLoading(false);
      });
    } else {
      setSelectedDayAtt([]);
    }
  }, [selectedDay]);

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
      var hasEvent = (schedulesByDate[ds] || []).length > 0 || attendanceDates[ds] === true;
      var isToday = ds === todayStr;
      var isSelected = selectedDay === ds;
      var cls = 'cal-cell cal-day-cell';
      if (hasEvent) cls += ' cal-has-event';
      if (isToday && !isSelected) cls += ' cal-today';
      if (isSelected) cls += ' cal-selected';
      cells.push(
        <div key={dayNum} className={cls} onClick={function() { setSelectedDay(isSelected ? null : ds); }}>
          {dayNum}
        </div>
      );
    })(d);
  }

  var selectedSchedules = selectedDay ? (schedulesByDate[selectedDay] || []) : [];
  var selectedAttMap = {};
  for (var ai = 0; ai < selectedDayAtt.length; ai++) {
    selectedAttMap[selectedDayAtt[ai].student_id] = selectedDayAtt[ai];
  }

  var sidebarCards = [];
  var usedStudentIds = {};

  // Scheduled and replacement classes from schedulesByDate
  for (var si = 0; si < selectedSchedules.length; si++) {
    (function(sc) {
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

      var typeLabel = sc.type === 'replacement' ? 'Replacement' : 'Scheduled';
      var typeClass = sc.type === 'replacement' ? 'type-replacement' : 'type-scheduled';

      if (sc.type === 'replacement' && sc.students && sc.students.length > 0) {
        var st = sc.students[0];
        usedStudentIds[st.id] = true;
        sidebarCards.push(
          <div key={sc.id} className={'schedule-card-item type-badge ' + typeClass}>
            <div className="schedule-card-time">{formatTime24to12(sc.time)}</div>
            <div className="schedule-card-body">
              <strong>{st.name}</strong>
              <span className={typeClass + '-label'}>{typeLabel}</span>
              <div className="schedule-card-duration">{formatDateTimeRange(sc.time, sc.end_time)}{calcDuration(sc.time, sc.end_time)}</div>
              <div className="schedule-card-students">{st.name} ({st.attendance_status === 'present' ? 'Present' : st.attendance_status === 'absent' ? 'Absent' : 'Not marked'})</div>
            </div>
          </div>
        );
      } else if (sc.type === 'scheduled') {
        sidebarCards.push(
          <div key={sc.id} className="schedule-card-item">
            <div className="schedule-card-time">{formatTime24to12(sc.time)}</div>
            <div className="schedule-card-body">
              <strong>{sc.class_name}</strong>
              <span className="type-scheduled-label">Scheduled</span>
              <div className="schedule-card-duration">{formatDateTimeRange(sc.time, sc.end_time)}{calcDuration(sc.time, sc.end_time)}</div>
              <div className="schedule-card-students">{sc.students.map(function(s) {
                usedStudentIds[s.id] = true;
                var label = s.name;
                if (s.attendance_status === 'present') label += ' (Present)';
                else if (s.attendance_status === 'absent') label += ' (Absent)';
                else label += ' (Not marked)';
                return label;
              }).join(', ')}</div>
            </div>
          </div>
        );
      }
    })(selectedSchedules[si]);
  }

  // Normal attendance records for selected day (not already in scheduled/replacement)
  for (var ai2 = 0; ai2 < selectedDayAtt.length; ai2++) {
    var ar = selectedDayAtt[ai2];
    if (usedStudentIds[ar.student_id] || ar.replacement_for_id || ar.scheduled_class_id) continue;
    sidebarCards.push(
      <div key={'att-' + ar.id} className="schedule-card-item type-badge type-attendance">
        <div className="schedule-card-time">{formatTime24to12(ar.time)}{ar.end_time ? ' - ' + formatTime24to12(ar.end_time) : ''}</div>
        <div className="schedule-card-body">
          <strong>{ar.student_name}</strong>
          <span className="type-attendance-label">Attendance</span>
          <div className="schedule-card-duration">{formatDateTimeRange(ar.time, ar.end_time)}{calcDuration(ar.time, ar.end_time)}</div>
          <div className="schedule-card-students">{ar.student_name} ({ar.status === 'present' ? 'Present' : 'Absent'})</div>
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

        <div className="dashboard-sidebar" style={{ width: 320 }}>
          {!loading && !selectedDay && (
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <p className="status-text" style={{ fontSize: 14 }}>Click a date to see scheduled classes</p>
            </div>
          )}
          {!loading && selectedDay && (
            <div className="card" style={{ padding: 14 }}>
              <h3 className="section-title" style={{ fontSize: 15, marginBottom: 8 }}>{formatDate(selectedDay)}</h3>
              {sidebarLoading && <p className="status-text">Loading...</p>}
              {!sidebarLoading && sidebarCards.length === 0 ? (<p className="status-text">No classes scheduled</p>) : (
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