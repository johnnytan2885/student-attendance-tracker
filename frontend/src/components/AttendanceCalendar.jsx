import { useState } from 'react';
import { formatDate } from '../utils.js';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function AttendanceCalendar({ attendanceRecords }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const attendanceMap = {};
  attendanceRecords.forEach(r => {
    attendanceMap[r.date] = r.status;
  });

  function pad(n) { return String(n).padStart(2, '0'); }
  function dateStr(d) { return `${year}-${pad(month + 1)}-${pad(d)}`; }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`blank-${i}`} className="cal-cell cal-blank" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(d);
    const status = attendanceMap[ds];
    let cls = 'cal-cell';
    if (status === 'present') cls += ' cal-present';
    else if (status === 'absent') cls += ' cal-absent';
    cells.push(<div key={d} className={cls}>{d}</div>);
  }

  return (
    <div className="attendance-calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>&lsaquo;</button>
        <span className="cal-title">{MONTHS[month].slice(0, 3)} {year}</span>
        <button className="cal-nav" onClick={nextMonth}>&rsaquo;</button>
      </div>
      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        {cells}
      </div>
      <div className="cal-legend">
        <span><span className="legend-dot cal-present" /> P</span>
        <span><span className="legend-dot cal-absent" /> A</span>
      </div>
    </div>
  );
}

export default AttendanceCalendar;