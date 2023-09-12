<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import { parseDataFromRequest } from "@/utils/parseDataFromRequest";
import emitter from "@/services/emitter";
import { clearObject } from "@/utils/clearObject";
import { convertObjectFieldValues } from "@/utils/convertValue";
import TooltipComponent from "@/components/TooltipComponent.vue";
import VoteInput from "@/components/inputs/VoteInput.vue";
import { generateLink } from "@/utils/generateLink";
import Client from "@/services/Obyte";
import { getAssetMetadataByArray } from "@/services/DAGApi";
import { getAddressByBaseAA } from "@/utils/addressUtils";
import { ADDRESSES } from "@/config";
import BackButtonComponent from "@/components/BackButtonComponent.vue";

const props = defineProps([
  "reserveAssetSymbol",
  "reserveAsset",
  "reservePriceAA",
]);

defineEmits(["goBack"]);

const store = useAaInfoStore();
const { meta } = storeToRefs(store);

const router = useRouter();

const swapFee = ref("3");
const arbProfitTax = ref("90");
const adjustmentPeriod = ref("3");
const presalePeriod = ref("14");
const auctionPriceHalvingPeriod = ref("3");
const tokenShareThreshold = ref("10");
const minS0Share = ref("1");

const existsError = ref("");
const poolNameExistsAA = ref("");
const link = ref("");
const awaiting = ref(false);

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
    console.log("result", result);
    existsError.value = result[0].response.error;
    await getNameForExistsAA(existsError.value.substring(27));
    return;
  }

  existsError.value = "";
}

emitter.on(`aa_request_${ADDRESSES.factory_aa}`, async (data) => {
  if (!awaiting.value) return;

  const _d = parseDataFromRequest(data);
  const obj = getObject();

  if (JSON.stringify(_d) === JSON.stringify(obj)) {
    const address = getAddressByBaseAA(ADDRESSES.base_aa, obj);
    await router.push(`/create/${address}`);
  }
});

watch(
  [
    swapFee,
    arbProfitTax,
    adjustmentPeriod,
    presalePeriod,
    auctionPriceHalvingPeriod,
    tokenShareThreshold,
    minS0Share,
  ],
  async () => {
    link.value = "";
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
    <div class="text-xl">{{ reserveAssetSymbol }}</div>
    <div class="text-sm mt-2">
      {{ reservePriceAA }}
    </div>

    <div class="form-control mt-6">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Swap fee</span>
        </label>
        <TooltipComponent field-name="swap_fee"></TooltipComponent>
      </div>
      <VoteInput v-model="swapFee" :type="'percent'" label="%" />
    </div>
    <div class="form-control">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Arb profit tax</span>
        </label>
        <TooltipComponent field-name="arb_profit_tax"> </TooltipComponent>
      </div>
      <VoteInput v-model="arbProfitTax" :type="'percent'" label="%" />
    </div>
    <div class="form-control">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Adjustment period</span>
        </label>
        <TooltipComponent field-name="adjustment_period"> </TooltipComponent>
      </div>
      <VoteInput v-model="adjustmentPeriod" :type="'date'" label="days" />
    </div>
    <div class="form-control">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Presale period</span>
        </label>
        <TooltipComponent field-name="presale_period"> </TooltipComponent>
      </div>
      <VoteInput v-model="presalePeriod" :type="'date'" label="days" />
    </div>
    <div class="form-control">
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
    </div>
    <div class="form-control">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Token share threshold</span>
        </label>
        <TooltipComponent field-name="token_share_threshold">
        </TooltipComponent>
      </div>
      <VoteInput v-model="tokenShareThreshold" :type="'percent'" label="%" />
    </div>
    <div class="form-control">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">Min s0 share</span>
        </label>
        <TooltipComponent field-name="min_s0_share"> </TooltipComponent>
      </div>
      <VoteInput v-model="minS0Share" :type="'percent'" label="%" />
    </div>
  </div>

  <div v-if="existsError" class="my-4 text-red-500">
    {{ existsError }} {{ poolNameExistsAA }}
  </div>
  <div class="form-control mt-6">
    <a
      class="btn btn-primary"
      :href="link"
      :class="{
        '!btn-disabled': reserveAsset === '' || existsError || link === '',
      }"
      @click="setAwaiting(true)"
      >Create</a
    >
  </div>
</template>

<style scoped></style>
