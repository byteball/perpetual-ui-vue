<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { generateLink } from "@/utils/generateLink";
import { clearObject } from "@/utils/clearObject";
import { parseDataForFactoryRequest } from "@/utils/parseDataForFactoryRequest";
import { getJoint } from "@/services/DAGApi";
import emitter from "@/services/emitter";

import Client from "@/services/Obyte";

const router = useRouter();

const awaiting = ref(false);
const link = ref("");
const reserveAsset = ref({ value: "base", error: "" });
const swapFee = ref({ value: "0.003", error: "" });
const arbProfitTax = ref({ value: "0.9", error: "" });
const adjustmentPeriod = ref({ value: "", error: "" });
const presalePeriod = ref({ value: "", error: "" });
const auctionPriceHalvingPeriod = ref({ value: "", error: "" });
const tokenShareThreshhold = ref({ value: "", error: "" });
const minS0Share = ref({ value: "", error: "" });

function setAwaiting(value) {
  awaiting.value = value;
}

emitter.on(`aa_request_${import.meta.env.VITE_FACTORY_AA}`, async (data) => {
  if (!awaiting.value) return;

  const _d = parseDataForFactoryRequest(data);
  const obj = clearObject({
    reserve_asset: reserveAsset.value.value,
    swap_fee: swapFee.value.value,
    arb_profit_tax: arbProfitTax.value.value,
    adjustment_period: adjustmentPeriod.value.value,
    presale_period: presalePeriod.value.value,
    auction_price_halving_period: auctionPriceHalvingPeriod.value.value,
    token_share_threshold: tokenShareThreshhold.value.value,
    min_s0_share: minS0Share.value.value,
  });

  if (JSON.stringify(_d) === JSON.stringify(obj)) {
    const result = await Client.api.dryRunAa({
      trigger: {
        address: "K237YYRMBYWCJBLSZGLJTXLZVVEXLI2Y",
        outputs: {
          base: 10000,
        },
        data: obj,
      },
      address: import.meta.env.VITE_FACTORY_AA, // sent to AA address
    });
    const r = result.find(
      (r) => r.aa_address === import.meta.env.VITE_FACTORY_AA
    );
    if (r.response?.responseVars?.address) {
      const address = r.response.responseVars.address;
      await router.push(`/create/${address}`);
    }
  }
});

watch(
  [
    reserveAsset,
    swapFee,
    arbProfitTax,
    adjustmentPeriod,
    presalePeriod,
    auctionPriceHalvingPeriod,
    tokenShareThreshhold,
    minS0Share,
  ],
  () => {
    link.value = generateLink(
      10000,
      clearObject({
        reserve_asset: reserveAsset.value.value,
        swap_fee: swapFee.value.value,
        arb_profit_tax: arbProfitTax.value.value,
        adjustment_period: adjustmentPeriod.value.value,
        presale_period: presalePeriod.value.value,
        auction_price_halving_period: auctionPriceHalvingPeriod.value.value,
        token_share_threshold: tokenShareThreshhold.value.value,
        min_s0_share: minS0Share.value.value,
      }),
      null,
      import.meta.env.VITE_FACTORY_AA,
      "base",
      true
    );
  },
  {
    immediate: true,
    deep: true,
  }
);

watch(
  () => reserveAsset.value.value,
  async () => {
    reserveAsset.value.error = "";

    const reserverAssetValue = reserveAsset.value.value;
    if (!reserverAssetValue) {
      return;
    }

    if (reserverAssetValue === "base") {
      return;
    }

    const joint = await getJoint(reserverAssetValue);

    if (
      !joint ||
      !joint.joint.unit.messages.find((m) => m.app === "definition")
    ) {
      reserveAsset.value.error = "Asset not found";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => tokenShareThreshhold.value.value,
  () => {
    tokenShareThreshhold.value.error = "";

    const tokenShareThreshholdValue = tokenShareThreshhold.value.value;
    if (!tokenShareThreshholdValue) {
      return;
    }

    if (tokenShareThreshholdValue < 0) {
      tokenShareThreshhold.value.error = "Must be a non-negative number";
    }

    if (tokenShareThreshholdValue >= 1) {
      tokenShareThreshhold.value.error = "Must be less than 1";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => swapFee.value.value,
  () => {
    swapFee.value.error = "";

    const swapFeeValue = swapFee.value.value;
    if (!swapFeeValue) {
      return;
    }

    if (swapFeeValue < 0) {
      swapFee.value.error = "Must be a non-negative number";
    }

    if (swapFeeValue >= 1) {
      swapFee.value.error = "Must be less than 1";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => minS0Share.value.value,
  () => {
    minS0Share.value.error = "";

    const minS0ShareValue = minS0Share.value.value;
    if (!minS0ShareValue) {
      return;
    }

    if (minS0ShareValue < 0) {
      minS0Share.value.error = "Must be a non-negative number";
    }

    if (minS0ShareValue >= 1) {
      minS0Share.value.error = "Must be less than 1";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => arbProfitTax.value.value,
  () => {
    arbProfitTax.value.error = "";

    const arbProfitTaxValue = arbProfitTax.value.value;
    if (!arbProfitTaxValue) {
      return;
    }

    if (arbProfitTaxValue < 0) {
      arbProfitTax.value.error = "Must be a non-negative number";
    }
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <div class="container w-[512px] m-auto mt-40 mb-36 p-8">
    <div v-if="awaiting">
      <div>Awaiting...</div>
      <div>
        <button class="btn btn-primary" @click="setAwaiting(false)">
          Cancel
        </button>
      </div>
    </div>
    <div v-show="!awaiting">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Reserve asset</span>
        </label>
        <input
          type="text"
          placeholder="Reserve asset"
          v-model="reserveAsset.value"
          class="input input-bordered w-full"
          :class="{ 'input-error': reserveAsset.error }"
        />
        <span
          v-if="reserveAsset.error"
          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
        >
          {{ reserveAsset.error }}
        </span>
      </div>
      <!--      <div class="form-control">-->
      <!--        <label class="label">-->
      <!--          <span class="label-text">Swap fee</span>-->
      <!--        </label>-->
      <!--        <input-->
      <!--          type="text"-->
      <!--          placeholder="Swap fee"-->
      <!--          v-model="swapFee.value"-->
      <!--          class="input input-bordered"-->
      <!--          :class="{ 'input-error': swapFee.error }"-->
      <!--        />-->
      <!--        <span-->
      <!--          v-if="swapFee.error"-->
      <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
      <!--        >-->
      <!--          {{ swapFee.error }}-->
      <!--        </span>-->
      <!--      </div>-->
      <!--      <div class="form-control">-->
      <!--        <label class="label">-->
      <!--          <span class="label-text">Arb profit tax</span>-->
      <!--        </label>-->
      <!--        <input-->
      <!--          type="text"-->
      <!--          placeholder="Arb profit tax"-->
      <!--          v-model="arbProfitTax.value"-->
      <!--          class="input input-bordered"-->
      <!--          :class="{ 'input-error': arbProfitTax.error }"-->
      <!--        />-->
      <!--        <span-->
      <!--          v-if="arbProfitTax.error"-->
      <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
      <!--        >-->
      <!--          {{ arbProfitTax.error }}-->
      <!--        </span>-->
      <!--      </div>-->
      <!--      <div class="form-control">-->
      <!--        <label class="label">-->
      <!--          <span class="label-text">Adjustment period</span>-->
      <!--        </label>-->
      <!--        <IntegerInput-->
      <!--          :inputType="'integer'"-->
      <!--          :inputProperty="adjustmentPeriod"-->
      <!--        />-->
      <!--        <span-->
      <!--          v-if="adjustmentPeriod.error"-->
      <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
      <!--        >-->
      <!--          {{ adjustmentPeriod.error }}-->
      <!--        </span>-->
      <!--      </div>-->
      <!--      <div class="form-control">-->
      <!--        <label class="label">-->
      <!--          <span class="label-text">Presale period</span>-->
      <!--        </label>-->
      <!--        <input-->
      <!--          type="text"-->
      <!--          placeholder="Presale period"-->
      <!--          v-model="presalePeriod.value"-->
      <!--          @input="handleIntegerInput"-->
      <!--          class="input input-bordered"-->
      <!--          :class="{ 'input-error': presalePeriod.error }"-->
      <!--        />-->
      <!--        <span-->
      <!--          v-if="presalePeriod.error"-->
      <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
      <!--        >-->
      <!--          {{ presalePeriod.error }}-->
      <!--        </span>-->
      <!--      </div>-->
      <!--      <div class="form-control">-->
      <!--        <label class="label">-->
      <!--          <span class="label-text">Auction price halving period</span>-->
      <!--        </label>-->
      <!--        <input-->
      <!--          type="text"-->
      <!--          placeholder="Auction price halving period"-->
      <!--          v-model="auctionPriceHalvingPeriod.value"-->
      <!--          @input="handleIntegerInput"-->
      <!--          class="input input-bordered"-->
      <!--          :class="{ 'input-error': auctionPriceHalvingPeriod.error }"-->
      <!--        />-->
      <!--        <span-->
      <!--          v-if="auctionPriceHalvingPeriod.error"-->
      <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
      <!--        >-->
      <!--          {{ auctionPriceHalvingPeriod.error }}-->
      <!--        </span>-->
      <!--      </div>-->
      <!--      <div class="form-control">-->
      <!--        <label class="label">-->
      <!--          <span class="label-text">Token share threshhold</span>-->
      <!--        </label>-->
      <!--        <input-->
      <!--          type="text"-->
      <!--          placeholder="Token share threshhold"-->
      <!--          v-model="tokenShareThreshhold.value"-->
      <!--          class="input input-bordered"-->
      <!--          :class="{ 'input-error': tokenShareThreshhold.error }"-->
      <!--        />-->
      <!--        <span-->
      <!--          v-if="tokenShareThreshhold.error"-->
      <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
      <!--        >-->
      <!--          {{ tokenShareThreshhold.error }}-->
      <!--        </span>-->
      <!--      </div>-->
      <!--      <div class="form-control">-->
      <!--        <label class="label">-->
      <!--          <span class="label-text">Min s0 share</span>-->
      <!--        </label>-->
      <!--        <input-->
      <!--          type="text"-->
      <!--          placeholder="Min s0 share"-->
      <!--          v-model="minS0Share.value"-->
      <!--          class="input input-bordered"-->
      <!--          :class="{ 'input-error': minS0Share.error }"-->
      <!--        />-->
      <!--        <span-->
      <!--          v-if="minS0Share.error"-->
      <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
      <!--        >-->
      <!--          {{ minS0Share.error }}-->
      <!--        </span>-->
      <!--      </div>-->
      <div class="form-control mt-6">
        <a
          class="btn btn-primary"
          :href="link"
          :class="{ 'btn-disabled': reserveAsset.value === '' }"
          @click="setAwaiting(true)"
          >Create</a
        >
      </div>
    </div>
  </div>
</template>
