<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import emitter from "@/services/emitter";

import Client from "@/services/Obyte";
import { getAssetMetadata, getMetaForPerpAAs } from "@/services/DAGApi";
import { generateLink } from "@/utils/generateLink";
import { parseDataForFactoryRequest } from "@/utils/parseDataForFactoryRequest";

const route = useRoute();
const router = useRouter();

const exists = ref(false);
const link = ref("");
const asset = ref("");
const symbol = ref("");
const decimals = ref(0);
const description = ref("");
const buttonEnabled = ref(false);

const fillInputsForStep = (assetUnit) => {
  asset.value = assetUnit;
  symbol.value = "";
  decimals.value = 0;
  description.value = "";

  if (route.query.step === "2") {
    description.value = `Asset0 for perpetual futures AA ${route.params.aa}`;
  }
};

watch(exists, async () => {
  const currentPerpetualMeta = await getMetaForPerpAAs([route.params.aa]);
  const reserveAsset = currentPerpetualMeta[route.params.aa].reserve_asset;

  if (reserveAsset === "base") {
    await router.push({
      path: `/create/${route.params.aa}`,
      query: { step: 2 },
    });
    fillInputsForStep(currentPerpetualMeta[route.params.aa].state.asset0);

    return;
  }

  const reserveAssetMetadata = await getAssetMetadata(reserveAsset);

  if (!reserveAssetMetadata) {
    await router.push({
      path: `/create/${route.params.aa}`,
      query: { step: 1 },
    });
    fillInputsForStep(currentPerpetualMeta[route.params.aa].reserve_asset);

    return;
  }

  await router.push({
    path: `/create/${route.params.aa}`,
    query: { step: 2 },
  });
  fillInputsForStep(currentPerpetualMeta[route.params.aa].state.asset0);
});

emitter.on(`aa_request_${import.meta.env.VITE_REGISTRY_AA}`, async (data) => {
  const payload = parseDataForFactoryRequest(data);

  if (payload.asset === asset.value && route.query.step === "1") {
    const currentPerpetualMeta = await getMetaForPerpAAs([route.params.aa]);

    await router.push({
      path: `/create/${route.params.aa}`,
      query: { step: 2 },
    });
    fillInputsForStep(currentPerpetualMeta[route.params.aa].state.asset0);

    return;
  }

  if (payload.asset === asset.value && route.query.step === "2") {
    await router.push({
      path: `/create/${route.params.aa}`,
      query: { step: 3 },
    });
  }
});

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
  buttonEnabled.value = false;

  if (!symbol.value) {
    return;
  }

  if (decimals.value === "") {
    return;
  }

  if (!description.value) {
    return;
  }

  link.value = generateLink(
    10000,
    {
      asset: asset.value,
      symbol: symbol.value,
      decimals: decimals.value,
      description: description.value,
    },
    null,
    import.meta.env.VITE_REGISTRY_AA,
    "base",
    true
  );

  buttonEnabled.value = true;
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
  <div class="card flex w-full max-w-sm bg-base-100 justify-center">
    <div class="card-body">
      <div v-if="!exists">Please await</div>
      <div v-if="exists && route.query.step !== '3'">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Asset</span>
          </label>
          <input
            type="text"
            v-model="asset"
            class="input input-bordered"
            readonly
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Symbol</span>
          </label>
          <input type="text" v-model="symbol" class="input input-bordered" />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Decimals</span>
          </label>
          <input
            type="number"
            v-model="decimals"
            min="0"
            class="input input-bordered"
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Description</span>
          </label>
          <textarea v-model="description" class="textarea textarea-bordered" />
        </div>
        <div class="form-control mt-6">
          <a
            class="btn btn-primary"
            :href="link"
            :class="{ 'btn-disabled': !buttonEnabled }"
            >Register symbol</a
          >
        </div>
      </div>
      <div v-if="exists && route.query.step === '3'">Finish</div>
    </div>
  </div>
</template>
