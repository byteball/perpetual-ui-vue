import Decimal from "decimal.js";

Decimal.set({
  precision: 15, // double precision is 15.95 https://en.wikipedia.org/wiki/IEEE_754
  rounding: Decimal.ROUND_HALF_EVEN,
  maxE: 308, // double overflows between 1.7e308 and 1.8e308
  minE: -324, // double underflows between 2e-324 and 3e-324
  toExpNeg: -7, // default, same as for js number
  toExpPos: 21, // default, same as for js number
});

export const getExchangeResultByState = (
  tokens,
  deltaReserve,
  asset,
  assetInfo,
  state,
  varsAndParams
  // trigger_initial_address = "ADDRESS"
) => {
  tokens = new Decimal(tokens);
  deltaReserve = new Decimal(deltaReserve);
  const getParameter = (name, defaultValue) => {
    if (varsAndParams[name] !== undefined) {
      return varsAndParams[name];
    }

    return defaultValue;
  };

  const getSwapFee = () => getParameter("swap_fee", 0.003);
  const getArbProfitTaxRate = () => getParameter("arb_profit_tax", 0.9);

  if (
    (tokens.toNumber() < 0 && deltaReserve.toNumber() !== 0) ||
    (tokens.toNumber() !== 0 && deltaReserve.toNumber() < 0)
  ) {
    return { error: "Invalid input" };
  }

  if (!tokens.toNumber() && !deltaReserve.toNumber()) {
    return {
      delta_s: 0,
      payout: 0,
      new_supply: 0,
      fee_percent: 0,
      state,
      asset_info: assetInfo,
    };
  }

  const op = tokens ? "sell" : "buy";
  const bAsset0 = state.asset0 === asset;

  const reserve = new Decimal(state.reserve);
  const coef = new Decimal(state.coef);
  const oldSupply = new Decimal(bAsset0 ? state.s0 : assetInfo.supply);
  const a = new Decimal(bAsset0 ? state.a0 : assetInfo.a);
  const oldPrice = oldSupply.gt(0)
    ? coef.pow(2).times(a).times(oldSupply).div(reserve)
    : new Decimal(0);

  const key = "last_" || op;
  const last_trade = bAsset0 ? state[key] : assetInfo[key];
  // const bMerge =
  //   Math.round(Date.now() / 1000) <= last_trade.ts + tradeMergePeriod &&
  //   trigger_initial_address == last_trade.address;
  const bMerge = false;
  const recent_tax = bMerge ? last_trade.tax : 0;
  const recent_delta_s = bMerge ? last_trade.delta_s : 0;
  const initial_p = bMerge
    ? tokens.gt(0)
      ? Decimal.max(oldPrice, last_trade.initial_p)
      : Decimal.min(oldPrice, last_trade.initial_p)
    : new Decimal(oldPrice);

  const swapFeeRate = getSwapFee();
  const arbProfitTaxRate = getArbProfitTaxRate();

  const getNewSupply = (newR, feeRate) => {
    return new Decimal(oldSupply)
      .pow(2)
      .plus(
        new Decimal(newR)
          .pow(2)
          .minus(new Decimal(reserve).pow(2))
          .div(new Decimal(coef).pow(2))
          .div(a)
          .times(new Decimal(1).minus(feeRate))
      )
      .sqrt();
  };

  const getNewReserve = (newS, feeRate) => {
    return new Decimal(reserve)
      .pow(2)
      .plus(
        new Decimal(newS)
          .pow(2)
          .minus(new Decimal(oldSupply).pow(2))
          .times(new Decimal(coef).pow(2))
          .times(a)
          .times(new Decimal(1).minus(feeRate))
      )
      .sqrt();
  };

  let newSupply;
  let newReserve;
  let arbProfitTax;
  let fullFeeRate;
  let swapFee;
  let deltaSupply;

  if (tokens.gt(0)) {
    deltaSupply = new Decimal(tokens).negated();
    newSupply = new Decimal(oldSupply).minus(tokens);
    const newReserve1 = getNewReserve(newSupply, swapFeeRate);

    let newA1;
    if (bAsset0) {
      const aDecimal = new Decimal(a);
      const oldSupplyDecimal = new Decimal(oldSupply);
      const newReserveDecimal = new Decimal(newReserve1);
      const reserveDecimal = new Decimal(reserve);
      const coefDecimal = new Decimal(coef);
      const newSupply1Decimal = new Decimal(newSupply);

      const oldSupplySq = oldSupplyDecimal.mul(oldSupplyDecimal);
      const newReserveSq = newReserveDecimal.mul(newReserveDecimal);
      const reserveSq = reserveDecimal.mul(reserveDecimal);

      const part1 = aDecimal.mul(oldSupplySq);
      const part2 = newReserveSq
        .minus(reserveSq)
        .div(coefDecimal)
        .div(coefDecimal);

      newA1 = part1
        .plus(part2)
        .div(newSupply1Decimal)
        .div(newSupply1Decimal)
        .toString();
    } else {
      newA1 = a;
    }

    const newPrice1 = new Decimal(coef)
      .times(coef)
      .times(newA1)
      .times(newSupply)
      .div(newReserve1);

    arbProfitTax = new Decimal(arbProfitTaxRate)
      .times(initial_p.minus(newPrice1))
      .times(tokens.minus(recent_delta_s))
      .div(2)
      .minus(recent_tax);
    fullFeeRate = new Decimal(swapFeeRate).plus(
      arbProfitTax.div(new Decimal(reserve).minus(newReserve1))
    );

    if (fullFeeRate.gt(1)) {
      return { error: "fee would exceed 100%" };
    }

    newReserve = Decimal.ceil(getNewReserve(newSupply, fullFeeRate));

    if (new Decimal(newReserve).gt(reserve)) {
      return { error: `The amount is too large, try less` };
    }

    swapFee = new Decimal(swapFeeRate).times(
      new Decimal(reserve).minus(newReserve)
    );
    state.a0 = bAsset0
      ? new Decimal(state.a0)
          .times(oldSupply)
          .times(oldSupply)
          .plus(
            new Decimal(newReserve)
              .times(newReserve)
              .minus(new Decimal(reserve).times(reserve))
              .div(coef)
              .div(coef)
          )
          .div(newSupply)
          .div(newSupply)
      : new Decimal(state.a0).plus(
          new Decimal(fullFeeRate)
            .times(a)
            .times(oldSupply)
            .times(oldSupply)
            .minus(newSupply)
            .times(newSupply)
            .div(state.s0)
            .div(state.s0)
        );
  } else {
    newReserve = deltaReserve.plus(reserve);
    swapFee = deltaReserve.times(swapFeeRate);
    const newSupply1 = getNewSupply(newReserve, swapFeeRate);

    let newA1;
    if (bAsset0) {
      const aDecimal = new Decimal(a);
      const oldSupplyDecimal = new Decimal(oldSupply);
      const newReserveDecimal = new Decimal(newReserve);
      const reserveDecimal = new Decimal(reserve);
      const coefDecimal = new Decimal(coef);
      const newSupply1Decimal = new Decimal(newSupply1);

      const oldSupplySq = oldSupplyDecimal.mul(oldSupplyDecimal);
      const newReserveSq = newReserveDecimal.mul(newReserveDecimal);
      const reserveSq = reserveDecimal.mul(reserveDecimal);

      const part1 = aDecimal.mul(oldSupplySq);
      const part2 = newReserveSq
        .minus(reserveSq)
        .div(coefDecimal)
        .div(coefDecimal);

      newA1 = part1
        .plus(part2)
        .div(newSupply1Decimal)
        .div(newSupply1Decimal)
        .toString();
    } else {
      newA1 = a;
    }

    const newP1 = new Decimal(
      new Decimal(coef).pow(2).times(newA1).times(newSupply1)
    ).div(newReserve);

    arbProfitTax = new Decimal(arbProfitTaxRate)
      .times(new Decimal(newP1).minus(initial_p))
      .times(new Decimal(newSupply1).minus(oldSupply).plus(recent_delta_s))
      .div(2)
      .minus(recent_tax);

    fullFeeRate = new Decimal(swapFeeRate).plus(arbProfitTax.div(deltaReserve));

    if (fullFeeRate.gt(1)) {
      return { error: "fee would exceed 100%" };
    }

    newSupply = getNewSupply(newReserve, fullFeeRate).floor();

    deltaSupply = newSupply.minus(oldSupply);

    if (deltaSupply.lt(0)) {
      return { error: `The amount is too small, try more` };
    }

    state.a0 = bAsset0
      ? new Decimal(state.a0)
          .times(new Decimal(oldSupply).pow(2))
          .plus(
            new Decimal(newReserve)
              .pow(2)
              .minus(new Decimal(reserve).pow(2))
              .div(new Decimal(coef).pow(2))
          )
          .div(new Decimal(newSupply).pow(2))
      : new Decimal(state.a0).plus(
          new Decimal(fullFeeRate)
            .times(
              new Decimal(newReserve).pow(2).minus(new Decimal(reserve).pow(2))
            )
            .div(new Decimal(coef).pow(2))
            .div(new Decimal(state.s0).pow(2))
        );
  }

  if (state.a0.lt(0)) {
    return { error: `a0 would become ${state.a0.toString()}` };
  }

  state.reserve = newReserve.toNumber();
  if (bAsset0) {
    if (state.a0.lt(a)) {
      return { error: "a0 should grow" };
    }
    state.s0 = newSupply.toNumber();
  } else {
    assetInfo.supply = newSupply.toNumber();
  }

  const newPrice = new Decimal(coef)
    .pow(2)
    .times(a)
    .times(newSupply)
    .div(newReserve);

  const total_fee = new Decimal(swapFee).plus(arbProfitTax);

  let payout;
  let fee_percent;
  if (tokens) {
    payout = new Decimal(reserve).minus(newReserve);
    fee_percent = total_fee.div(payout).times(100);
  } else {
    fee_percent = total_fee.div(deltaReserve).times(100);
  }

  state.a0 = state.a0.toNumber();
  return {
    payout: payout.toNumber(),
    delta_s: deltaSupply.toNumber(),
    new_supply: newSupply.toNumber(),
    old_reserve: reserve,
    new_reserve: newReserve,
    delta_reserve: newReserve - reserve,
    old_price: oldPrice.toNumber(),
    new_price: newPrice.toNumber(),
    swap_fee: swapFee,
    arb_profit_tax: arbProfitTax,
    total_fee: total_fee.toNumber(),
    fee_percent: fee_percent.abs().toNumber(),
    state,
    asset_info: assetInfo,
  };
};
