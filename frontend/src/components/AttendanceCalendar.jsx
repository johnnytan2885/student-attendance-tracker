import { useState, useEffect } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function AttendanceCalendar({ attendanceRecords }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) return null;

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
    <div className="card attendance-calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>&larr;</button>
        <span className="cal-title">{MONTHS[month]} {year}</span>
        <button className="cal-nav" onClick={nextMonth}>&rarr;</button>
      </div>
      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        {cells}
      </div>
      <div className="cal-legend">
        <span><span className="legend-dot cal-present" /> Present</span>
        <span><span className="legend-dot cal-absent" /> Absent</span>
      </div>
    </div>
  );
}

export default AttendanceCalendar;