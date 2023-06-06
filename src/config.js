export const network = import.meta.env.VITE_NETWORK || "mainnet";

export const explorerUrl =
  network === "mainnet" ? "explorer.obyte.org" : "testnetexplorer.obyte.org";

export const fullExplorerUrlForUnit = `https://${explorerUrl}/`;

export const fullExplorerUrlForAddress = `https://${explorerUrl}/address/`;

export const fullExplorerUrlForAsset = `https://${explorerUrl}/asset/`;

export const tokenUrl = `https://${
  network === "mainnet" ? "" : "testnet."
}tokens.ooo/`;

export const perpDefaults = {
  swap_fee: 0.003,
  arb_profit_tax: 0.9,
  adjustment_period: 3 * 24 * 3600, // 3 days
  presale_period: 14 * 24 * 3600, // 14 days
  auction_price_halving_period: 3 * 24 * 3600, // 3 days
  token_share_threshold: 0.1, // 10%
  min_s0_share: 0.01, // 1%
};
