<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import emitter from "@/services/emitter";

import Client from "@/services/Obyte";
import { getAssetMetadata, getMetaForPerpAAs } from "@/services/DAGApi";
import { generateLink } from "@/utils/generateLink";

const route = useRoute();

const exists = ref(false);
const step = ref(0);
const link = ref("");
const asset = ref("");
const symbol = ref({ value: "", error: "" });
const decimals = ref({ value: 0, error: "" });
const description = ref({ value: "", error: "" });

watch(exists, async () => {
  const currentPerpetualMeta = await getMetaForPerpAAs([route.params.aa]);
  const reserveAsset = currentPerpetualMeta[route.params.aa].reserve_asset;
  console.log("123", currentPerpetualMeta[route.params.aa].reserve_asset);
  console.log("1234", currentPerpetualMeta[route.params.aa].state.asset0);
  if (reserveAsset === "base") {
    step.value = 2;
    return;
  }

  const reserveAssetMetadata = await getAssetMetadata(reserveAsset);

  if (!reserveAssetMetadata) {
    step.value = 1;
    return;
  }

  step.value = 2;
});

// emitter.on(
//   `aa_request_${import.meta.env.VITE_REGISTRY_AA}`,
//   async (data) => {}
// );

emitter.on(`aa_response_${import.meta.env.VITE_FACTORY_AA}`, (data) => {
  console.log("aa_res", data);
  if (
    data.response.responseVars &&
    data.response.responseVars.address === route.params.aa
  ) {
    exists.value = true;
  }
});

watch([asset, symbol, decimals, description], () => {
  if (!symbol.value.value) {
    symbol.value.error = "Symbol is required field!";
    return;
  }

  if (!decimals.value.value) {
    decimals.value.error = "Decimals is required field!";
    return;
  }

  if (!description.value.value) {
    description.value.error = "Description is required field!";
    return;
  }

  link.value = generateLink(
    10000,
    {
      asset: asset.value.value,
      symbol: symbol.value.value,
      decimals: decimals.value.value,
      description: description.value.value,
    },
    null,
    import.meta.env.VITE_REGISTRY_AA,
    "base",
    true
  );
});

onMounted(() => {
  console.log("aa:", route.params.aa);
  Client.api.getDefinition(route.params.aa, function (err, result) {
    if (err) return console.error(err);
    exists.value = !!result;
  });
});
</script>

<template>
  <div v-if="!exists">Please await</div>
  <div v-if="exists">
    ZBS
    <div v-if="step === 1"></div>

    <div v-if="step === 2">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Asset</span>
        </label>
        <input
          type="text"
          v-model="asset.value"
          class="input input-bordered"
          readonly
        />
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Symbol</span>
        </label>
        <input
          type="text"
          v-model="symbol.value"
          class="input input-bordered"
          :class="{ 'input-error': symbol.error }"
        />
        <span
          v-if="symbol.error"
          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
        >
          {{ symbol.error }}
        </span>
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Decimals</span>
        </label>
        <input
          type="number"
          v-model="decimals.value"
          class="input input-bordered"
          :class="{ 'input-error': decimals.error }"
        />
        <span
          v-if="decimals.error"
          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
        >
          {{ decimals.error }}
        </span>
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Description</span>
        </label>
        <textarea
          v-model="description.value"
          class="textarea textarea-bordered"
          :class="{ 'textarea-error': description.error }"
        />
        <span
          v-if="description.error"
          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
        >
          {{ description.error }}
        </span>
      </div>
      <div class="form-control mt-6">
        <a class="btn btn-primary" :href="link">Register symbol</a>
      </div>
    </div>
  </div>
</template>
