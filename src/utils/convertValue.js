export function rawToFormatVotingValue(type, value) {
  switch (type) {
    case "date":
      return value / 24 / 3600;
    case "percent":
      return value * 100;
    default:
      return value;
  }
}

export function formatToRawVotingValue(type, value) {
  switch (type) {
    case "date":
      return value * 24 * 3600;
    case "percent":
      return value / 100;
    default:
      return value;
  }
}
