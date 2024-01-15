export const propertyTips = {
  oracle:
    "Address of an oracle that publishes the data that will be used to calculate the asset's price",
  feed_name: "Name of the data feed published by the oracle",
  multiplier:
    "Multiplier applied to the oracle's price. It is used to account for decimals and return the price of the smallest indivisible unit of the asset. The decimals of the symbol for this asset should correspond to this multiplier.",
  swap_fee: "Swapping fee, percentage of the traded amount",
  arb_profit_tax: `Additional fee that is charged as a percentage of arbitrageur profit.
   It is assumed that arbitrageurs buy here in order
   to sell elsewhere and make a profit from the difference in prices.`,
  adjustment_period:
    "The time it takes for the asset's price to automatcally correct to the target price",
  presale_period: "Presale duration in days for newly launched assets",
  auction_price_halving_period:
    "Auction price halving period for newly launched pre-IPO assets",
  token_share_threshold:
    "If a newly launched asset on a presale reaches this share of the total assets, the presale ends prematurely.",
  min_s0_share:
    "Minimum share of the governance asset among all assets. If it drops below this level, the prices of all other assets are automatically decreased to protect the share of the governance asset.",
  price_aa: "An autonomous agent used to obtain the target asset price", // используется в trading блоке в Governance/manage(GM)
  drift_rate:
    "If non-zero, the asset depreciates at this rate per year and the value is moved to governance asset holders",
  reserve_price_value: "Current price of the reserve asset", // то что возвращает reserve asset aa в долларах:($11.164200000000001 (i))
  reserve_price:
    "An autonomous agent used to obtain the price of the reserve asset", // example: Reserve price(i): Z4OWP7ILJFZPSYAOBPLOH4HMIKB4POHX
  staking_aa: "Staking autonomous agent",
  current_vp: "Current voting power",
  new_vp: "New voting power",
  max_drift_rate:
    "Maximum drift rate per year. Governance can set some assets to continuously depreciate and move their value to the governance asset holders. This is the maximum allowed depreciation speed. A reasonable maximum is important to assure the asset holders that they have protection against malicious governance.",
  stakers_fee_share: "Stacking reward from the total fees",
};
