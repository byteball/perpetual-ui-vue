export function isValidNumber(value) {
  const v = Number(value);
  return !isNaN(v);
}

export function isValidUnit(unit) {
  return (
    typeof unit === "string" && unit.length === 44 && unit === atob(btoa(unit))
  );
}
