export function formatIsoDate(date) {
  return date.replace("T", " ").substring(0, date.length - 8);
}
