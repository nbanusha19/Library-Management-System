export function formatDateShort(s) {
  if (!s) return "";
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  const parts = String(s).split(/\s+/);
  if (parts.length >= 3) return parts[1] + ' ' + parts[2].replace(/,/, '');
  return s;
}

export function formatDateFull(s) {
  if (!s) return "";
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return s;
}
