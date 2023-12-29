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

export function convertObjectFieldValues(obj) {
  for (const objKey in obj) {
    obj[objKey] = formatToRawVotingValue(fieldTypes[objKey], obj[objKey]);
  }
}
