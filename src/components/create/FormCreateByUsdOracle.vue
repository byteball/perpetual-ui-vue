<script setup>
import { onUnmounted, ref, watch } from "vue";
import { ADDRESSES } from "@/config";
import { isValidAddress } from "@/utils/validates";
import { followLink, generateDefinitionLink } from "@/utils/generateLink";
import { getAddressByDefinition } from "@/utils/addressUtils";
import {
  getAssetMetadata,
  getDataFeed,
  getDefinition,
} from "@/services/DAGApi";
import feedNamesByOracle from "@/feedNamesByOracle";
import TextInput from "@/components/inputs/TextInput.vue";
import AutocompleteComponent from "@/components/AutocompleteComponent.vue";
import emitter from "@/services/emitter";
import LoadingIcon from "@/components/icons/LoadingIcon.vue";
import BackButtonComponent from "@/components/BackButtonComponent.vue";

const props = defineProps(["reserveAsset"]);
const emit = defineEmits(["setReservePriceAa", "prevStep"]);

const oracleAddress = ref("F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N");
const dataFeed = ref("");
const addressIsValid = ref(false);
const errorMessage = ref("");

const watchAA = ref("");
const awaiting = ref(false);

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

async function openWallet() {
  const assetMetadata = await getAssetMetadata(props.reserveAsset);
  const data = {
    oracle: oracleAddress.value,
    feed_name: dataFeed.value,
    decimals: assetMetadata.decimals,
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
    return;
  }

  watchAA.value = address;
  const link = generateDefinitionLink(definition);
  followLink(link);
}

async function getFeedNameList() {
  if (!addressIsValid.value) return [];
  return feedNamesByOracle[oracleAddress.value] || [];
}

async function checkOracleData() {
  const result = await getDataFeed(oracleAddress.value, dataFeed.value);
  if (result) {
    openWallet();
    return;
  }
  errorMessage.value = "Data feed not found";
}

watch(
  oracleAddress,
  () => {
    addressIsValid.value = isValidAddress(oracleAddress.value);
  },
  {
    immediate: true,
  }
);

watch([oracleAddress, dataFeed], () => {
  errorMessage.value = "";
});

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
  <div v-else>
    <div class="mb-6">Well, now we need to select oracle and its feed name</div>
    <div>
      <TextInput v-model="oracleAddress" :labelAttribute="'Oracle address'" />
    </div>
    <div class="mt-2">
      <AutocompleteComponent
        :get-src-for-auto-complete="getFeedNameList"
        v-model="dataFeed"
        :label-attribute="'Feed name'"
      />
    </div>
    <div v-if="errorMessage" class="mt-2 mb-2 text-red-500">
      {{ errorMessage }}
    </div>
    <div class="text-center">
      <button
        class="btn btn-primary mt-4"
        :class="{ '!btn-disabled': !oracleAddress || !dataFeed }"
        @click="checkOracleData"
      >
        Create reserve price aa
      </button>
    </div>
  </div>
</template>

<style scoped></style>
