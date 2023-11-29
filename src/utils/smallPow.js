function pow2(x) {
  return x * x;
}

export function small_pow(x, pow) {
  if (pow === 0) {
    return 1;
  }
  if (pow === 1) {
    return x;
  }
  if (pow === 2) {
    return pow2(x);
  }
  if (pow === 3) {
    return pow2(x) * x;
  }
  if (pow === 4) {
    return pow2(pow2(x));
  }
  if (pow === 5) {
    return pow2(pow2(x)) * x;
  }
  if (pow === 6) {
    return pow2(pow2(x) * x);
  }
  if (pow === 7) {
    return pow2(pow2(x) * x) * x;
  }
  if (pow === 8) {
    return pow2(pow2(pow2(x)));
  }
  if (pow === 9) {
    return pow2(pow2(pow2(x))) * x;
  }
  if (pow === 10) {
    return pow2(pow2(pow2(x)) * x);
  }
  if (pow === 11) {
    return pow2(pow2(pow2(x)) * x) * x;
  }
  if (pow === 12) {
    return pow2(pow2(pow2(x) * x));
  }
  throw new Error("unsupported power " + pow);
}
