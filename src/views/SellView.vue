<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import { generateLink } from "@/utils/generateLink";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getExchangeResultByState } from "@/utils/getExchangeResultByState";

const router = useRouter();
const route = useRoute();

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const selectedAA = ref("");
const amount = ref("");
const link = ref("");
const metaByAA = ref(null);
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
      return;
    }

    selectedAA.value = "";
    metaByAA.value = null;
  },
  { immediate: true }
);

watch(selectedAA, () => {
  router.push(`/sell/${selectedAA.value}`);
});

watch(amount, () => {
  if (!metaByAA.value) return;
  const aa = route.params.aa;

  link.value = generateLink(
    amount.value,
    {
      asset: metaByAA.value.state.asset0,
    },
    null,
    aa,
    metaByAA.value.state.asset0,
    true
  );

  if (Number(amount.value) <= 0) {
    result.value = {};
    return;
  }
  result.value = getExchangeResultByState(
    Number(amount.value),
    0,
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
        <a class="btn btn-sm" :href="link">Sell</a>
      </div>
    </div>
  </div>
</template>
