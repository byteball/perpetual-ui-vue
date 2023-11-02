<script setup>
import { nextTick, onUnmounted, ref } from "vue";
import { ADDRESSES } from "@/config";
import { followLink, generateDefinitionLink } from "@/utils/generateLink";
import { getAddressByDefinition } from "@/utils/addressUtils";
import { getDefinition } from "@/services/DAGApi";
import emitter from "@/services/emitter";
import LoadingIcon from "@/components/icons/LoadingIcon.vue";
import BackButtonComponent from "@/components/BackButtonComponent.vue";
import OracleComponent from "@/components/OracleComponent.vue";

defineProps(["reserveAssetSymbol"]);
const emit = defineEmits(["setReservePriceAa", "prevStep"]);

const oracleResult = ref({});
const errorMessage = ref("");

const watchAA = ref("");
const awaiting = ref(false);
const loaded = ref(false);

function handleDefinition(payload) {
  if (payload.address === watchAA.value) {
    awaiting.value = true;
  }
}

function handleDefinitionSaved(payload) {
  if (payload.address === watchAA.value) {
    emit("setReservePriceAa", watchAA.value);
  }
}

emitter.on(`aa_definition_${ADDRESSES.reserve_price_usd}`, handleDefinition);
emitter.on(
  `aa_definition_saved_${ADDRESSES.reserve_price_usd}`,
  handleDefinitionSaved
);

async function checkDefinitionAndReturnParamsIfNotExists() {
  const { oracleAddress, dataFeed, symbolMetadata } = oracleResult.value;
  const data = {
    oracle: oracleAddress,
    feed_name: dataFeed,
    decimals: symbolMetadata?.decimals || 0,
  };

  const definition = [
    "autonomous agent",
    {
      base_aa: ADDRESSES.reserve_price_usd,
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
  if (!Object.keys(oracleResult.value).length) return;

  const r = await checkDefinitionAndReturnParamsIfNotExists();
  if (!r.address) return;

  watchAA.value = r.address;
  const link = generateDefinitionLink(r.definition);
  followLink(link);
}

async function checkAndSetLoadedVar() {
  await nextTick();
  if (Object.keys(oracleResult.value).length) {
    await checkDefinitionAndReturnParamsIfNotExists();
  }

  loaded.value = true;
}

function setEmptyData() {
  oracleResult.value = {};
  errorMessage.value = "";
}

function setError(error) {
  setEmptyData();
  errorMessage.value = error;
}
function oracleDataUpdated(result) {
  setEmptyData();
  if (result.error) {
    checkAndSetLoadedVar();
    return setError(result.error);
  }

  if (result.oracleAddress) {
    oracleResult.value = result;
  }
  checkAndSetLoadedVar();
}

onUnmounted(() => {
  emitter.off(`aa_definition_${ADDRESSES.reserve_price_usd}`, handleDefinition);
  emitter.off(
    `aa_definition_saved_${ADDRESSES.reserve_price_usd}`,
    handleDefinitionSaved
  );
});
</script>

<template>
  <Teleport to="#back_button"
    ><BackButtonComponent @click="$emit('prevStep')"
  /></Teleport>
  <div v-if="awaiting">
    <div>
      The payment is detected, as soon as it is confirmed, you will proceed to
      the next step<LoadingIcon />
    </div>
  </div>
  <div v-if="!loaded" class="text-center">
    <LoadingIcon />
  </div>
  <div v-show="loaded && !awaiting">
    <div class="mb-6">
      Price AA for
      <span class="font-bold">{{ reserveAssetSymbol }}</span> doesn't exist yet,
      please create it below:
    </div>
    <OracleComponent
      @data-updated="oracleDataUpdated"
      :symbol="reserveAssetSymbol"
    />
    <div v-if="errorMessage" class="mt-2 mb-2 text-red-500">
      {{ errorMessage }}
    </div>
    <div v-if="!errorMessage && oracleResult.oracleAddress" class="mt-2">
      Current value:
      {{
        oracleResult.value != null
          ? `$${+oracleResult.value.toFixed(2)}`
          : "not found"
      }}
    </div>
    <div class="text-center">
      <button
        class="btn btn-primary mt-4"
        :class="{ '!btn-disabled': oracleResult.value == null }"
        @click="openWallet"
      >
        Create reserve price aa
      </button>
    </div>
  </div>
</template>

<style scoped></style>
