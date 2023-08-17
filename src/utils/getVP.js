import {
  COMMON_TS,
  DEFAULT_DECAY_FACTOR,
  DEFAULT_MAX_TERM,
  YEAR_IN_SEC,
} from "@/globalConstants";

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
    decay_factor ** (term / 360 + (timestamp - COMMON_TS) / YEAR_IN_SEC)
  );
}

export function getVPFromNormalized(
  normalized_vp,
  decay_factor = DEFAULT_DECAY_FACTOR,
  timestamp
) {
  if (!normalized_vp) return 0;

  return (
    normalized_vp / decay_factor ** ((timestamp - COMMON_TS) / YEAR_IN_SEC)
  );
}
