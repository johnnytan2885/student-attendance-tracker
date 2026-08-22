export function formatTime24to12(timeStr) {
  if (!timeStr) return '--:--';
  var parts = timeStr.split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h = h - 12;
  return h + ':' + m + ' ' + ampm;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  var parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

export function formatDateTimeRange(startTime, endTime) {
  return formatTime24to12(startTime) + (endTime ? ' - ' + formatTime24to12(endTime) : '');
}

export function calcDuration(startTime, endTime) {
  if (!startTime || !endTime) return '';
  var s = startTime.split(':').map(Number);
  var e = endTime.split(':').map(Number);
  var min = (e[0] * 60 + e[1]) - (s[0] * 60 + s[1]);
  if (min <= 0) return '';
  return ' (' + Math.floor(min / 60) + 'h' + (min % 60 > 0 ? min % 60 + 'm' : '') + ')';
}