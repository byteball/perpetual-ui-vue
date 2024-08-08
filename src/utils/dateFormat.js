function addPad(num) {
  return num.toString().padStart(2, "0");
}

export function getTime(date) {
  const d = new Date(date);
  return `${addPad(d.getHours())}:${addPad(d.getMinutes())}`;
}

export function getDay(date) {
  const d = new Date(date);
  return addPad(d.getDate());
}
