<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import { generateLink } from "@/utils/generateLink";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getPresaleAssetsFromMeta } from "@/utils/getAssetsFromMeta";

const router = useRouter();
const route = useRoute();

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const selectedAA = ref("");
const selectedAsset = ref("");
const amount = ref("");
const link = ref("");
const metaByAA = ref(null);
const assets = ref([]);

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
      assets.value = getPresaleAssetsFromMeta(meta.value[aa]);
      if (assets.value.length) {
        selectedAsset.value = assets.value[0];
      }
      return;
    }

    selectedAA.value = "";
    metaByAA.value = null;
    assets.value = [];
  },
  { immediate: true }
);

watch(selectedAA, () => {
  router.push(`/presale/${selectedAA.value}`);
});

watch(amount, () => {
  if (!metaByAA.value) return;
  const aa = route.params.aa;

  link.value = generateLink(
    metaByAA.value.reserve_asset === "base"
      ? Number(amount.value) + 1000
      : amount.value,
    {
      asset: selectedAsset.value,
      presale: 1,
    },
    null,
    aa,
    metaByAA.value.reserve_asset,
    true
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
    <div v-show="metaByAA && !assets.length">Presale assets not found</div>
    <div v-show="metaByAA && assets.length">
      <select class="select select-bordered mb-4" v-model="selectedAsset">
        <option v-for="asset in assets" :key="asset" :value="asset">
          {{ asset }}
        </option>
      </select>
      <div class="mt-2">
        <input
          type="text"
          placeholder="Amount"
          v-model="amount"
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
      <div class="mt-2">
        <a class="btn btn-sm" :href="link">Buy</a>
      </div>
    </div>
  </div>
</template>
