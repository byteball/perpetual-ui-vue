export function getDistributeStakerFees(state, aa_state, user_perp) {
  if (!user_perp) {
    return 0;
  }

  const user_share = user_perp.normalized_vp / state.total_normalized_vp;

  if (!user_perp.last_perp_emissions.r) {
    user_perp.last_perp_emissions.r = 0;
  }
  if (!user_perp.rewards.r) {
    user_perp.rewards.r = 0;
  }

  const new_fees_since_prev_visit =
    aa_state.total_staker_fees - user_perp.last_perp_emissions.r;

  return new_fees_since_prev_visit * user_share;
}
