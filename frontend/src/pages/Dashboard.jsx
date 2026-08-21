import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchedulesRange, getAttendanceDates, getTodayAttendance, getAttendanceByDate } from '../api/client.js';

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
      var [schedData, attDates, todayData] = await Promise.all([
        getSchedulesRange(first, last),
        getAttendanceDates(first, last),
        getTodayAttendance()
      ]);
      setSchedules(schedData);
      setTodayAtt(todayData);
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

  // Build sidebar: scheduled classes + attendance records for the selected day
  var sidebarCards = [];

  // Scheduled classes for selected day
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
      <div key={'sched-' + sc.id} className="schedule-card-item">
        <div className="schedule-card-time">{sc.time}</div>
        <div className="schedule-card-body">
          <strong>{sc.class_name}</strong>
          <div className="schedule-card-duration">{sc.time}{sc.end_time ? ' - ' + sc.end_time : ''}{durStr}</div>
          <div className="schedule-card-students">{sc.students.map(function(s) {
            var label = s.name;
            if (s.attendance_status === 'present') label += ' (P)';
            else if (s.attendance_status === 'absent') label += ' (A)';
            return label;
          }).join(', ')}</div>
          {sc.notes && <div className="profile-detail">{sc.notes}</div>}
        </div>
      </div>
    );
  }

  // Attendance records for selected day (non-scheduled) — skip records already covered by a scheduled class
  var scheduledStudentIds = {};
  for (var si2 = 0; si2 < selectedSchedules.length; si2++) {
    var sched = selectedSchedules[si2];
    if (sched.type === 'scheduled' && sched.students) {
      for (var si3 = 0; si3 < sched.students.length; si3++) {
        scheduledStudentIds[sched.students[si3].id] = true;
      }
    }
  }
  for (var ai = 0; ai < selectedDayAtt.length; ai++) {
    var ar = selectedDayAtt[ai];
    // Skip if this student+date combo is already shown in a scheduled class, or if this is a replacement marking record
    if (scheduledStudentIds[ar.student_id] || ar.replacement_for_id) continue;
    sidebarCards.push(
      <div key={'att-' + ar.id} className="schedule-card-item">
        <div className="schedule-card-time">{ar.time || '--:--'}{ar.end_time ? '-' + ar.end_time : ''}</div>
        <div className="schedule-card-body">
          <strong>{ar.student_name}</strong>
          <div className="schedule-card-duration">{ar.status === 'present' ? 'Present' : 'Absent'}</div>
        </div>
      </div>
    );
  }

  // Horizontal timeline 08:00 - 18:00
  var todaySchedules = schedulesByDate[todayStr] || [];
  var HOURS_START = 8;
  var HOURS_END = 18;
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

  // Merge scheduled classes and attendance records for today's timeline
  var timelineItems = [];
  todaySchedules.forEach(function(sc) {
    timelineItems.push({
      id: 'sched-' + sc.id,
      time: sc.time,
      end_time: sc.end_time,
      label: sc.class_name,
      students: sc.students.map(function(s) { return s.name; }).join(', ')
    });
  });
  todayAtt.forEach(function(ar) {
    if (ar.time) {
      timelineItems.push({
        id: 'att-' + ar.id,
        time: ar.time,
        end_time: ar.end_time || '',
        label: ar.student_name,
        students: ''
      });
    }
  });

  var sorted = timelineItems.slice().sort(function(a, b) {
    return (a.time || '00:00').localeCompare(b.time || '00:00');
  });

  var lanes = [];
  for (var ti = 0; ti < sorted.length; ti++) {
    var item = sorted[ti];
    var sH = Number((item.time || '08:00').split(':')[0]);
    var sM = Number((item.time || '08:00').split(':')[1]);
    var eH = item.end_time ? Number(item.end_time.split(':')[0]) : (sH + 1);
    var eM = item.end_time ? Number(item.end_time.split(':')[1]) : sM;
    var startMin = sH * 60 + sM;
    var endMin = eH * 60 + eM;

    var assignedLane = -1;
    for (var li = 0; li < lanes.length; li++) {
      var conflict = false;
      for (var bi = 0; bi < lanes[li].length; bi++) {
        var existing = lanes[li][bi];
        if (startMin < existing.end && endMin > existing.start) {
          conflict = true;
          break;
        }
      }
      if (!conflict) { assignedLane = li; break; }
    }
    if (assignedLane === -1) {
      assignedLane = lanes.length;
      lanes.push([]);
    }
    lanes[assignedLane].push({ schedule: item, start: startMin, end: endMin });
  }

  var timelineBlocks = [];
  var laneHeight = 24;
  var trackHeight = Math.max(lanes.length * laneHeight, laneHeight);

  for (var laneIdx = 0; laneIdx < lanes.length; laneIdx++) {
    for (var bi = 0; bi < lanes[laneIdx].length; bi++) {
      var entry = lanes[laneIdx][bi];
      var ts2 = entry.schedule;
      var classStartMin = Math.max(entry.start - HOURS_START * 60, 0);
      var classEndMin = Math.min(entry.end - HOURS_START * 60, MINUTES_TOTAL);
      var leftPct = (classStartMin / MINUTES_TOTAL) * 100;
      var widthPct = Math.max(((classEndMin - classStartMin) / MINUTES_TOTAL) * 100, 1.5);

      timelineBlocks.push(
        <div
          key={ts2.id}
          className="htimeline-block"
          style={{ left: leftPct + '%', width: widthPct + '%', top: (laneIdx * laneHeight) + 'px', height: (laneHeight - 2) + 'px' }}
        >
          <span className="htimeline-block-name">{ts2.label}</span>
          <span className="htimeline-block-students">{ts2.students}</span>
        </div>
      );
    }
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

      {timelineItems.length > 0 && (
        <div className="card htimeline-card">
          <h3 className="section-title">Today's Schedule - {todayStr}</h3>
          <div className="htimeline-wrap">
            <div className="htimeline-nowrap">
              <div className="htimeline-labels">{hourLabels}</div>
              <div className="htimeline-track" style={{ height: trackHeight + 'px' }}>
                {timelineBlocks}
              </div>
            </div>
          </div>
        </div>
      )}

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