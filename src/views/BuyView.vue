<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { getExchangeResultByState } from "@/utils/getExchangeResultByState";
import { getAllAssetsFromMeta } from "@/utils/getAssetsFromMeta";
import { generateLink } from "@/utils/generateLink";

import { useAaInfoStore } from "@/stores/aaInfo";

const router = useRouter();
const route = useRoute();

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const selectedAA = ref("");
const selectedAsset = ref("asset0");
const amount = ref("");
const link = ref("");
const metaByAA = ref(null);
const assets = ref([]);
const result = ref({});

watch(
  () => {
    const aa = route.params.aa;
    const ml = Object.keys(meta.value).length;

    return `${aa}_${ml > 0}`;
  },
  () => {
    const aa = route.params.aa;
    if (aa && meta.value[aa]) {
      selectedAA.value = aa;
      metaByAA.value = meta.value[aa];
      // assets.value = getAllAssetsFromMeta(meta.value[aa]);
      return;
    }

    selectedAA.value = "";
    metaByAA.value = null;
    assets.value = [];
  },
  { immediate: true }
);

watch(selectedAA, () => {
  router.push(`/buy/${selectedAA.value}`);
});

watch(amount, () => {
  if (!metaByAA.value) return;
  const aa = route.params.aa;

  link.value = generateLink(
    metaByAA.value.reserve_asset === "base"
      ? Number(amount.value) + 1000
      : amount.value,
    {
      asset: metaByAA.value.state.asset0,
    },
    null,
    aa,
    metaByAA.value.reserve_asset,
    true
  );

  if (Number(amount.value) <= 0) {
    result.value = {};
    return;
  }
  result.value = getExchangeResultByState(
    0,
    Number(amount.value),
    metaByAA.value.state.asset0,
    null,
    { ...metaByAA.value.state },
    metaByAA.value
  );
});
</script>

<template>
  <div class="form">
    <div>
      <select class="select select-bordered mb-4" v-model="selectedAA">
        <option value="" disabled>Please select aa</option>
        <option v-for="aa in aas" :key="aa" :value="aa">{{ aa }}</option>
      </select>
    </div>
    <div v-show="!metaByAA">Waiting...</div>
    <div v-show="metaByAA">
      <div>Asset: {{ metaByAA?.state.asset0 || "" }}</div>
      <!--      <select class="select select-bordered mb-4" v-model="selectedAsset">-->
      <!--        <option value="asset0" disabled>asset0</option>-->
      <!--        <option v-for="asset in assets" :key="asset" :value="asset">-->
      <!--          {{ asset }}-->
      <!--        </option>-->
      <!--      </select>-->
      <div class="mt-2">
        <input
          type="text"
          placeholder="Amount"
          v-model="amount"
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
      <div class="mt-2 whitespace-pre">
        Result: {{ JSON.stringify(result, null, 2) }}
      </div>
      <div class="mt-2">
        <a class="btn btn-sm" :href="link">Buy</a>
      </div>
    </div>
  </div>
</template>
