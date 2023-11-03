export const propertyTips = {
  oracle:
    "Address of Oracle that publishes the data that will be used to form the price",
  feed_name: "Name of the asset in Obyte network",
  multiplier: "Multiplier",
  swap_fee: "Swapping fee, percentage of traded amount.",
  arb_profit_tax: `Additional fee that is charged as a percentage of arbitrageur profit.
   It is assumed that arbitrageurs buy from the pool in order
   to sell elsewhere and make a profit from the difference in prices.`,
  adjustment_period: "adjustment period",
  presale_period: "Presale duration in days",
  auction_price_halving_period: "Auction price halving period",
  token_share_threshold: "Token share threshold",
  min_s0_share: "Minimum share of governance asset",
  price_aa: "An autonomous agent used to obtain the target asset price", // используется в trading блоке в Governance/manage(GM)
  drift_rate: "drift rate",
  reserve_price_value: "Current price of the reserve asset", // то что возвращает reserve asset aa в долларах:($11.164200000000001 (i))
  reserve_price:
    "An autonomous agent used to obtain the target price of a reserve asset", // example: Reserve price(i): Z4OWP7ILJFZPSYAOBPLOH4HMIKB4POHX
  staking_aa: "Staking aa",
  current_vp: "...",
  new_vp: "...",
};
