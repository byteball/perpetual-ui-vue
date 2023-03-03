export const getExchangeResultByState = (
  tokens,
  deltaReserve,
  asset,
  assetInfo,
  state,
  varsAndParams
  // trigger_initial_address = "ADDRESS"
) => {
  console.log("f", {
    tokens,
    deltaReserve,
    asset,
    assetInfo,
    state,
    varsAndParams,
  });
  const getParameter = (name, defaultValue) => {
    if (varsAndParams[name] !== undefined) {
      return varsAndParams[name];
    }

    return defaultValue;
  };

  const getSwapFee = () => getParameter("swap_fee", 0.003);
  const getArbProfitTaxRate = () => getParameter("arb_profit_tax", 0.9);

  if (
    (tokens < 0 && deltaReserve !== 0) ||
    (tokens !== 0 && deltaReserve < 0)
  ) {
    return { error: "Invalid input" };
  }

  const op = tokens ? "sell" : "buy";
  const bAsset0 = state.asset0 === asset;

  const reserve = state.reserve;
  const coef = state.coef;
  const oldSupply = bAsset0 ? state.s0 : assetInfo.supply;
  const a = bAsset0 ? state.a0 : assetInfo.a;
  const oldPrice = oldSupply ? (coef * coef * a * oldSupply) / reserve : 0;

  console.log("p = ", oldPrice);

  const key = "last_" || op;
  const last_trade = bAsset0 ? state[key] : assetInfo[key];
  // const bMerge =
  //   Math.round(Date.now() / 1000) <= last_trade.ts + tradeMergePeriod &&
  //   trigger_initial_address == last_trade.address;
  const bMerge = false;
  const recent_tax = bMerge ? last_trade.tax : 0;
  const recent_delta_s = bMerge ? last_trade.delta_s : 0;
  const initial_p = bMerge
    ? tokens
      ? Math.max(oldPrice, last_trade.initial_p)
      : Math.min(oldPrice, last_trade.initial_p)
    : oldPrice;

  const swapFeeRate = getSwapFee();
  const arbProfitTaxRate = getArbProfitTaxRate();

  const getNewSupply = (newR, feeRate) => {
    return Math.sqrt(
      oldSupply * oldSupply +
        ((newR * newR - reserve * reserve) / coef / coef / a) * (1 - feeRate)
    );
  };

  const getNewReserve = (newS, feeRate) => {
    return Math.sqrt(
      reserve * reserve +
        (newS * newS - oldSupply * oldSupply) * coef * coef * a * (1 - feeRate)
    );
  };

  let newSupply;
  let newReserve;
  let arbProfitTax;
  let fullFeeRate;
  let swapFee;
  let deltaSupply;

  if (tokens) {
    deltaSupply = -tokens;
    newSupply = oldSupply - tokens;
    const newReserve1 = getNewReserve(newSupply, swapFeeRate);
    const newPrice1 = (coef * coef * a * newSupply) / newReserve1;

    arbProfitTax =
      (arbProfitTaxRate * (initial_p - newPrice1) * (tokens - recent_delta_s)) /
        2 -
      recent_tax;
    fullFeeRate = swapFeeRate + arbProfitTax / (reserve - newReserve1);

    if (fullFeeRate > 1) {
      return { error: "fee would exceed 100%" };
    }

    newReserve = Math.ceil(getNewReserve(newSupply, fullFeeRate));

    if (newReserve > reserve) {
      return { error: `New reserve would increase to ${newReserve}!` };
    }

    swapFee = swapFeeRate * (reserve - newReserve);

    state.a0 = bAsset0
      ? (state.a0 * oldSupply * oldSupply +
          (newReserve * newReserve - reserve * reserve) / coef / coef) /
        newSupply /
        newSupply
      : state.a0 +
        (fullFeeRate * a * (oldSupply * oldSupply - newSupply * newSupply)) /
          state.s0 /
          state.s0;
  } else {
    newReserve = reserve + deltaReserve;
    swapFee = swapFeeRate * deltaReserve;
    const newSupply1 = getNewSupply(newReserve, swapFeeRate);

    console.log("new_s1", newSupply1);

    const newP1 = (coef * coef * a * newSupply1) / newReserve;

    console.log("new_p1", newP1);

    arbProfitTax =
      (arbProfitTaxRate *
        (newP1 - initial_p) *
        (newSupply1 - oldSupply + recent_delta_s)) /
        2 -
      recent_tax;

    fullFeeRate = swapFeeRate + arbProfitTax / deltaReserve;

    if (fullFeeRate > 1) {
      return { error: "fee would exceed 100%" };
    }

    newSupply = Math.floor(getNewSupply(newReserve, fullFeeRate));

    console.log("new_s = ", newSupply);

    deltaSupply = newSupply - oldSupply;

    if (deltaSupply < 0) {
      return { error: `New reserve would decrease by ${deltaSupply}!` };
    }

    state.a0 = bAsset0
      ? (state.a0 * oldSupply * oldSupply +
          (newReserve * newReserve - reserve * reserve) / coef / coef) /
        newSupply /
        newSupply
      : state.a0 +
        (fullFeeRate * (newReserve * newReserve - reserve * reserve)) /
          coef /
          coef /
          state.s0 /
          state.s0;
  }

  if (state.a0 < 0) {
    return { error: `a0 would become ${state.a0}` };
  }

  state.reserve = newReserve;
  if (bAsset0) {
    if (state.a0 < a) {
      return { error: "a0 should grow" };
    }
    state.s0 = newSupply;
  } else {
    assetInfo.supply = newSupply;
  }

  const newPrice = (coef * coef * a * newSupply) / newReserve;

  console.log("new_p = ", newPrice);

  const total_fee = swapFee + arbProfitTax;

  let payout;
  let fee_percent;
  if (tokens) {
    payout = reserve - newReserve;
    fee_percent = (total_fee / (reserve - newReserve)) * 100;
  } else {
    fee_percent = (total_fee / deltaReserve) * 100;
  }

  return {
    payout: payout,
    delta_s: deltaSupply,
    old_reserve: reserve,
    new_reserve: newReserve,
    delta_reserve: newReserve - reserve,
    old_price: oldPrice,
    new_price: newPrice,
    swap_fee: swapFee,
    arb_profit_tax: arbProfitTax,
    total_fee: total_fee,
    fee_percent: fee_percent,
  };
};
