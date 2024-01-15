import { followLink, generateLink } from "@/utils/generateLink";

export function withdrawReward(metaByAA, address) {
  const link = generateLink(
    10000,
    {
      perp_asset: metaByAA.state.asset0,
      withdraw_staker_fees: 1,
      withdraw_rewards: 1,
    },
    address,
    metaByAA.staking_aa,
    "base",
    true
  );
  followLink(link);
}
