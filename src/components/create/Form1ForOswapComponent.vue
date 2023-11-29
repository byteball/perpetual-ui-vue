<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import LoadingIcon from "@/components/icons/LoadingIcon.vue";
import {
  getAssetMetadataByArray,
  getDefinition,
  isUnitStable,
} from "@/services/DAGApi";
import emitter from "@/services/emitter";
import { ADDRESSES } from "@/config";
import { getAddressByDefinition } from "@/utils/addressUtils";
import { followLink, generateDefinitionLink } from "@/utils/generateLink";
import BackButtonComponent from "@/components/BackButtonComponent.vue";
import OracleComponent from "@/components/OracleComponent.vue";

const props = defineProps(["reserveAsset", "reserveAssetSymbol", "metadata"]);
const emit = defineEmits(["setReservePriceAa", "goBack"]);

const metadataByAsset = ref({});
const isLoaded = ref(false);
const xDecimals = ref(0);
const yDecimals = ref(0);
const xOracleResult = ref({});
const yOracleResult = ref({});
const xErrorMessage = ref("");
const yErrorMessage = ref("");

const watchAA = ref("");
const watchUnit = ref("");
const awaiting = ref(false);
const loaded = ref(false);
const oracleXLoaded = ref(false);
const oracleYLoaded = ref(false);

function handleDefinition({ payload, body }) {
  if (payload.address === watchAA.value) {
    awaiting.value = true;
    watchUnit.value = body.unit;
  }
}

function handleDefinitionSaved({ payload }) {
  if (payload.address === watchAA.value) {
    emit("setReservePriceAa", watchAA.value);
  }
}

emitter.on(`aa_definition_${ADDRESSES.reserve_price_oswap}`, handleDefinition);
emitter.on(
  `aa_definition_saved_${ADDRESSES.reserve_price_oswap}`,
  handleDefinitionSaved
);

async function checkDefinitionAndReturnParamsIfNotExists() {
  const { oracleAddress: xOracleAddress, dataFeed: xDataFeed } =
    xOracleResult.value;
  const { oracleAddress: yOracleAddress, dataFeed: yDataFeed } =
    yOracleResult.value;

  const data = {
    oswap_aa: props.metadata.address,
    x_oracle: xOracleAddress,
    y_oracle: yOracleAddress,
    x_feed_name: xDataFeed,
    y_feed_name: yDataFeed,
    x_decimals: xDecimals.value,
    y_decimals: yDecimals.value,
  };

  const definition = [
    "autonomous agent",
    {
      base_aa: ADDRESSES.reserve_price_oswap,
      params: data,
    },
  ];

  const address = getAddressByDefinition(definition);
  const def = await getDefinition(address);
  if (def.definition) {
    emit("setReservePriceAa", address);
    return {};
  }

  return {
    address,
    definition,
  };
}

async function openWallet() {
  if (
    !Object.keys(xOracleResult.value).length ||
    !Object.keys(yOracleResult.value).length
  ) {
    return;
  }

  const r = await checkDefinitionAndReturnParamsIfNotExists();
  if (!r.address) return;

  watchAA.value = r.address;
  const link = generateDefinitionLink(r.definition);
  followLink(link);
}

watch(
  () => props.reserveAsset,
  async () => {
    isLoaded.value = false;

    const { x_asset, y_asset } = props.metadata;
    const md = await getAssetMetadataByArray([x_asset, y_asset]);
    metadataByAsset.value = md;

    if (md[x_asset]) xDecimals.value = md[x_asset].decimals;
    if (md[y_asset]) yDecimals.value = md[y_asset].decimals;

    isLoaded.value = true;
  },
  {
    immediate: true,
  }
);

async function checkAndSetLoadedVar() {
  await nextTick();
  const wu = localStorage.getItem("tmp_create_wu");
  if (oracleXLoaded.value && oracleYLoaded.value) {
    if (
      Object.keys(xOracleResult.value).length &&
      Object.keys(yOracleResult.value).length
    ) {
      if (wu) return;
      await checkDefinitionAndReturnParamsIfNotExists();
    }

    loaded.value = true;
  }
}

function setXEmptyData() {
  xOracleResult.value = {};
  xErrorMessage.value = "";
}
function setYEmptyData() {
  yOracleResult.value = {};
  yErrorMessage.value = "";
}

function setXError(error) {
  setXEmptyData();
  xErrorMessage.value = error;
}
function setYError(error) {
  setYEmptyData();
  yErrorMessage.value = error;
}
function xOracleDataUpdated(result) {
  setXEmptyData();
  oracleXLoaded.value = true;
  if (result.error) {
    checkAndSetLoadedVar();
    return setXError(result.error);
  }

  if (result.oracleAddress) {
    xOracleResult.value = result;
  }
  checkAndSetLoadedVar();
}
function yOracleDataUpdated(result) {
  setYEmptyData();
  oracleYLoaded.value = true;
  if (result.error) {
    checkAndSetLoadedVar();
    return setYError(result.error);
  }

  if (result.oracleAddress) {
    yOracleResult.value = result;
  }
  checkAndSetLoadedVar();
}

function goBack() {
  emit("goBack");
}

watch(watchAA, () => {
  localStorage.setItem("tmp_create_waa", watchAA.value);
});

watch(watchUnit, () => {
  localStorage.setItem("tmp_create_wu", watchUnit.value);
});

onMounted(async () => {
  const wu = localStorage.getItem("tmp_create_wu");
  if (!wu) return;

  const waa = localStorage.getItem("tmp_create_waa");

  awaiting.value = true;
  const unitStable = await isUnitStable(wu);
  if (unitStable) {
    emit("setReservePriceAa", waa);
    return;
  }

  const interval = setInterval(async () => {
    const unitStable = await isUnitStable(wu);
    if (unitStable) {
      emit("setReservePriceAa", waa);
      clearInterval(interval);
    }
  }, 30000);
});

onUnmounted(() => {
  emitter.off(
    `aa_definition_${ADDRESSES.reserve_price_oswap}`,
    handleDefinition
  );
  emitter.off(
    `aa_definition_saved_${ADDRESSES.reserve_price_oswap}`,
    handleDefinitionSaved
  );
});
</script>

<template>
  <Teleport to="#back_button"><BackButtonComponent @click="goBack" /></Teleport>
  <div v-if="!isLoaded">
    <div class="text-center">Loading...<LoadingIcon /></div>
  </div>
  <div v-else-if="awaiting">
    <div>
      The payment is detected, as soon as it is confirmed, you will proceed to
      the next step<LoadingIcon />
    </div>
  </div>
  <div v-if="!loaded && isLoaded" class="text-center">
    <LoadingIcon />
  </div>
  <div v-if="isLoaded" v-show="loaded && !awaiting">
    <div>
      Price AA for
      <span class="font-bold">{{ reserveAssetSymbol }}</span> doesn't exist yet,
      please create it below:
    </div>
    <div class="divider"></div>
    <div>
      <div class="mb-2">
        Asset: {{ metadataByAsset[metadata.x_asset].name }}
      </div>
      <OracleComponent
        @data-updated="xOracleDataUpdated"
        :without-metadata="true"
        :symbol="metadataByAsset[metadata.x_asset].name"
      />
      <div v-if="xErrorMessage" class="mt-2 mb-2 text-red-500">
        {{ xErrorMessage }}
      </div>
      <div v-if="!xErrorMessage && xOracleResult.oracleAddress" class="mt-2">
        Current value:
        {{
          xOracleResult.value
            ? `$${+xOracleResult.value.toFixed(2)}`
            : "not found"
        }}
      </div>
    </div>
    <div class="divider"></div>
    <div>
      <div class="mb-2">
        Asset: {{ metadataByAsset[metadata.y_asset].name }}
      </div>
      <OracleComponent
        @data-updated="yOracleDataUpdated"
        :without-metadata="true"
        :symbol="metadataByAsset[metadata.y_asset].name"
      />
      <div v-if="yErrorMessage" class="mt-2 mb-2 text-red-500">
        {{ yErrorMessage }}
      </div>
      <div v-if="!yErrorMessage && yOracleResult.oracleAddress" class="mt-2">
        Current value:
        {{
          yOracleResult.value !== null
            ? `$${+yOracleResult.value.toFixed(2)}`
            : "not found"
        }}
      </div>
    </div>
    <div class="text-center">
      <button
        class="btn btn-primary mt-4"
        :class="{
          '!btn-disabled':
            xOracleResult.oracleAddress == null ||
            yOracleResult.oracleAddress == null,
        }"
        @click="openWallet"
      >
        Create reserve price AA
      </button>
    </div>
  </div>
</template>

<style scoped></style>
