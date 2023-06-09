export function isValidNumber(value) {
  const v = Number(value);
  console.log(value, v);
  return !isNaN(v);
}
