const COMMON_TS = 1657843200; // Fri Jul 15 2022 00:00:00 GMT+0000
const year = 31104000;
const DEFAULT_DECAY_FACTOR = 8;
const DEFAULT_MAX_TERM = 360;

export function getVP(
  balance,
  decay_factor = DEFAULT_DECAY_FACTOR,
  max_term = DEFAULT_MAX_TERM,
  term,
  timestamp
) {
  const final_voting_power = balance / decay_factor ** (max_term / 360);
  return (
    final_voting_power *
    decay_factor ** (term / 360 + (timestamp - COMMON_TS) / year)
  );
}

export function getVPFromNormalized(
  normalized_vp,
  decay_factor = DEFAULT_DECAY_FACTOR,
  timestamp
) {
  if (!normalized_vp) return 0;

  return normalized_vp * decay_factor ** ((timestamp - COMMON_TS) / year);
}
