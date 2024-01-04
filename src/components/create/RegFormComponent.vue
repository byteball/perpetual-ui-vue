<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { event } from "vue-gtag";
import { useAaInfoStore } from "@/stores/aaInfo";
import { useCreatePerpStore } from "@/stores/createPerpStore";
import { parseDataFromRequest } from "@/utils/parseDataFromRequest";
import emitter from "@/services/emitter";
import { clearObject } from "@/utils/clearObject";
import { convertObjectFieldValues } from "@/utils/convertValue";
import TooltipComponent from "@/components/TooltipComponent.vue";
import VoteInput from "@/components/inputs/VoteInput.vue";
import { generateLink } from "@/utils/generateLink";
import Client from "@/services/Obyte";
import { getAssetMetadata, getAssetMetadataByArray } from "@/services/DAGApi";
import { getAddressByBaseAA } from "@/utils/addressUtils";
import { ADDRESSES, fullExplorerUrlForAddress } from "@/config";
import BackButtonComponent from "@/components/BackButtonComponent.vue";

const props = defineProps([
  "reserveAssetSymbol",
  "reserveAsset",
  "reservePriceAA",
]);

defineEmits(["goBack"]);

const store = useAaInfoStore();
const { meta } = storeToRefs(store);

const createStore = useCreatePerpStore();

const router = useRouter();

const swapFee = ref("0.3");
const arbProfitTax = ref("90");
const adjustmentPeriod = ref("3");
const presalePeriod = ref("14");
const auctionPriceHalvingPeriod = ref("3");
const tokenShareThreshold = ref("10");
const minS0Share = ref("1");
const maxDriftRate = ref("50");

const existsError = ref("");
const addressExistsAA = ref("");
const poolNameExistsAA = ref("");
const asset0NotRegistered = ref(false);
const aaForRegSymbol = ref("");
const link = ref("");
const awaiting = ref(false);
const inputsError = ref({});

function setAwaiting(value) {
  awaiting.value = value;
}

function getObject() {
  const obj = clearObject({
    swap_fee: swapFee.value,
    arb_profit_tax: arbProfitTax.value,
    adjustment_period: adjustmentPeriod.value,
    presale_period: presalePeriod.value,
    auction_price_halving_period: auctionPriceHalvingPeriod.value,
    token_share_threshold: tokenShareThreshold.value,
    min_s0_share: minS0Share.value,
    max_drift_rate: maxDriftRate.value,
  });
  convertObjectFieldValues(obj);

  obj.reserve_asset = props.reserveAsset;
  obj.reserve_price_aa = props.reservePriceAA;

  return obj;
}
async function getNameForExistsAA(address) {
  poolNameExistsAA.value = "";
  const metaByAA = meta.value[address];
  if (!metaByAA) return;

  const reserveAsset = metaByAA.reserve_asset;
  const asset0 = metaByAA.state.asset0;

  const metadata = await getAssetMetadataByArray([reserveAsset, asset0]);
  if (!metadata[reserveAsset] || !metadata[asset0]) {
    return (poolNameExistsAA.value = "");
  }

  poolNameExistsAA.value = `(${metadata[reserveAsset].name}/${metadata[asset0].name})`;
}

async function checkAAForAlreadyExisting() {
  const result = await Client.api.dryRunAa({
    trigger: {
      address: import.meta.env.VITE_FACTORY_AA,
      outputs: {
        base: 10000,
      },
      data: getObject(),
    },
    address: import.meta.env.VITE_FACTORY_AA, // sent to AA address
  });

  if (result[0].response.error) {
    const error = result[0].response.error;
    if (!error.startsWith("such an AA already exists")) {
      existsError.value = error;
      return;
    }

    const address = error.substring(27);
    const metaByAA = meta.value[address];
    const asset0 = metaByAA.state.asset0;
    const reserveAssetMeta = await getAssetMetadata(asset0);

    if (!reserveAssetMeta) {
      asset0NotRegistered.value = true;
      aaForRegSymbol.value = address;
      existsError.value = "";
      return;
    }

    await getNameForExistsAA(address);
    addressExistsAA.value = address;
    existsError.value = "Such a futures set already exists";

    return;
  }

  existsError.value = "";
  asset0NotRegistered.value = false;
}

emitter.on(`aa_request_${ADDRESSES.factory_aa}`, async (data) => {
  if (!awaiting.value) return;

  const _d = parseDataFromRequest(data);
  const obj = getObject();

  if (JSON.stringify(_d) === JSON.stringify(obj)) {
    const address = getAddressByBaseAA(ADDRESSES.base_aa, obj);
    createStore.setCurrentAssetState({
      step: 3,
      address,
      reserveAssetSymbol: props.reserveAssetSymbol,
    });

    await router.push(`/create/${address}`);
  }
});

function setStoreData(address) {
  createStore.setCurrentAssetState({
    step: 3,
    address,
    reserveAssetSymbol: props.reserveAssetSymbol,
  });
}

function getMinMaxValue(name) {
  let min, max;
  switch (name) {
    case "min_s0_share":
    case "swap_fee":
    case "token_share_threshold":
      min = 0;
      max = 100;
      break;
    case "arb_profit_tax":
      min = 0;
      break;
    case "adjustment_period":
    case "presale_period":
    case "auction_price_halving_period":
      min = 0.001;
      break;
  }

  return { min, max };
}

function checkInputs() {
  inputsError.value = {};
  const inputs = {
    ["min_s0_share"]: minS0Share.value,
    ["swap_fee"]: swapFee.value,
    ["arb_profit_tax"]: arbProfitTax.value,
    ["token_share_threshold"]: tokenShareThreshold.value,
    ["adjustment_period"]: adjustmentPeriod.value,
    ["presale_period"]: presalePeriod.value,
    ["auction_price_halving_period"]: auctionPriceHalvingPeriod.value,
  };

  for (let key in inputs) {
    const { min, max } = getMinMaxValue(key);
    if (typeof min === "number" && +inputs[key] < min) {
      inputsError.value[key] = `Minimum value is ${min}`;
      return false;
    } else if (typeof max === "number" && +inputs[key] >= max) {
      inputsError.value[key] = `The value must be less than ${max}`;
      return false;
    }
  }

  return true;
}

function createPerpEvent() {
  event("add_new_perpetual_future", {
    event_label: `${props.reserveAsset} - ${props.reservePriceAA}`,
  });
}

watch(
  [
    swapFee,
    arbProfitTax,
    adjustmentPeriod,
    presalePeriod,
    auctionPriceHalvingPeriod,
    tokenShareThreshold,
    minS0Share,
    maxDriftRate,
  ],
  async () => {
    link.value = "";
    if (!checkInputs()) {
      return;
    }

    await checkAAForAlreadyExisting();

    link.value = generateLink(
      10000,
      getObject(),
      null,
      import.meta.env.VITE_FACTORY_AA,
      "base",
      true
    );
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <div>
    <Teleport to="#back_button"
      ><BackButtonComponent @click="$emit('goBack')"
    /></Teleport>
    <div class="text-xl">Reserve asset: {{ reserveAssetSymbol }}</div>
    <div class="mt-2 label-text flex items-center">
      Reserve price AA
      <TooltipComponent class="ml-1" field-name="reserve_price" />
    </div>
    <div class="mt-0.5">
      <a
        class="link text-sky-500 link-hover"
        target="_blank"
        :href="fullExplorerUrlForAddress + reservePriceAA"
        >{{ reservePriceAA }}</a
      >
    </div>

    <div class="form-control mt-6">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Swap fee</span>
        </label>
        <TooltipComponent field-name="swap_fee"></TooltipComponent>
      </div>
      <VoteInput v-model="swapFee" :type="'percent'" label="%" />
      <div v-if="inputsError.swap_fee" class="text-red-500 mt-1 text-xs">
        {{ inputsError.swap_fee }}%
      </div>
    </div>
    <div class="form-control mt-5">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Arb profit tax</span>
        </label>
        <TooltipComponent field-name="arb_profit_tax"> </TooltipComponent>
      </div>
      <VoteInput v-model="arbProfitTax" :type="'percent'" label="%" />
      <div v-if="inputsError.arb_profit_tax" class="text-red-500 mt-1 text-xs">
        {{ inputsError.arb_profit_tax }}%
      </div>
    </div>
    <div class="form-control mt-5">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Adjustment period</span>
        </label>
        <TooltipComponent field-name="adjustment_period"> </TooltipComponent>
      </div>
      <VoteInput v-model="adjustmentPeriod" :type="'date'" label="days" />
      <div
        v-if="inputsError.adjustment_period"
        class="text-red-500 mt-1 text-xs"
      >
        {{ inputsError.adjustment_period }} days
      </div>
    </div>
    <div class="form-control mt-5">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Presale period</span>
        </label>
        <TooltipComponent field-name="presale_period"> </TooltipComponent>
      </div>
      <VoteInput v-model="presalePeriod" :type="'date'" label="days" />
      <div v-if="inputsError.presale_period" class="text-red-500 mt-1 text-xs">
        {{ inputsError.presale_period }} days
      </div>
    </div>
    <div class="form-control mt-5">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Auction price halving period</span>
        </label>
        <TooltipComponent field-name="auction_price_halving_period">
        </TooltipComponent>
      </div>
      <VoteInput
        v-model="auctionPriceHalvingPeriod"
        :type="'date'"
        label="days"
      />
      <div
        v-if="inputsError.auction_price_halving_period"
        class="text-red-500 mt-1 text-xs"
      >
        {{ inputsError.auction_price_halving_period }} days
      </div>
    </div>
    <div class="form-control mt-5">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Token share threshold</span>
        </label>
        <TooltipComponent field-name="token_share_threshold">
        </TooltipComponent>
      </div>
      <VoteInput v-model="tokenShareThreshold" :type="'percent'" label="%" />
      <div
        v-if="inputsError.token_share_threshold"
        class="text-red-500 mt-1 text-xs"
      >
        {{ inputsError.token_share_threshold }}%
      </div>
    </div>
    <div class="form-control mt-5">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Min governance asset share</span>
        </label>
        <TooltipComponent field-name="min_s0_share"> </TooltipComponent>
      </div>
      <VoteInput v-model="minS0Share" :type="'percent'" label="%" />
      <div v-if="inputsError.min_s0_share" class="text-red-500 mt-1 text-xs">
        {{ inputsError.min_s0_share }}%
      </div>
    </div>
    <div class="form-control mt-5">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Max drift rate</span>
        </label>
        <TooltipComponent field-name="max_drift_rate" />
      </div>
      <VoteInput v-model="maxDriftRate" :type="'percent'" label="%" />
      <div v-if="inputsError.max_drift_rate" class="text-red-500 mt-1 text-xs">
        {{ inputsError.max_drift_rate }}%
      </div>
    </div>
  </div>

  <div v-if="existsError" class="my-4 text-red-500">
    {{ existsError }}
    <template v-if="addressExistsAA">
      <RouterLink
        :to="`/governance/management/${addressExistsAA}`"
        class="link underline"
        >{{ addressExistsAA }}</RouterLink
      >
      {{ poolNameExistsAA }}
    </template>
  </div>
  <div class="form-control mt-6">
    <RouterLink
      v-if="!existsError && asset0NotRegistered"
      :to="`/create/${aaForRegSymbol}`"
      @click="setStoreData(aaForRegSymbol)"
      class="btn btn-primary"
      >Create</RouterLink
    >
    <a
      v-else
      class="btn btn-primary"
      :href="link"
      :class="{
        '!btn-disabled': reserveAsset === '' || existsError || link === '',
      }"
      @click="
        () => {
          setAwaiting(true);
          createPerpEvent();
        }
      "
      >Create</a
    >
  </div>
</template>

<style scoped></style>
