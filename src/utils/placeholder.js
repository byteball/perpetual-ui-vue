export function getPlaceholderForAmount(decimals) {
  let placeholder = "0";
  if (decimals) {
    placeholder += "." + "0".repeat(decimals);
  }

  return placeholder;
}
