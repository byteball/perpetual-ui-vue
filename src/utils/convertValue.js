import Decimal from "decimal.js";

const fieldTypes = {
  swap_fee: "percent",
  arb_profit_tax: "percent",
  adjustment_period: "date",
  presale_period: "date",
  auction_price_halving_period: "date",
  token_share_threshold: "percent",
  min_s0_share: "percent",
  max_drift_rate: "percent",
};

export function rawToFormatVotingValue(type, value) {
  switch (type) {
    case "date":
      return new Decimal(value).div(24).div(3600).toNumber();
    case "percent":
      return new Decimal(value).times(100).toNumber();
    default:
      return value;
  }
}

export function formatToRawVotingValue(type, value) {
  switch (type) {
    case "date":
      return new Decimal(value).times(24).times(3600).toNumber();
    case "percent":
      return new Decimal(value).div(100).toNumber();
    default:
      return value;
  }
}

export function convertObjectFieldValues(obj) {
  for (const objKey in obj) {
    obj[objKey] = formatToRawVotingValue(fieldTypes[objKey], obj[objKey]);
  }
}
