export function calcVoteValue(value, type) {
  if (type === "date") {
    return value / 24 / 3600;
  } else {
    return value * 100;
  }
}
