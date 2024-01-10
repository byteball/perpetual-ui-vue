import Decimal from "decimal.js";

export function calcVoteValue(value, type) {
  if (type === "date") {
    return new Decimal(value).times(24).times(3600).toNumber();
  } else {
    return new Decimal(value).div(100).toNumber();
  }
}
