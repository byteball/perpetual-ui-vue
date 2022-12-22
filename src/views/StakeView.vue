<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import { generateLink } from "@/utils/generateLink";
import { useAaInfoStore } from "@/stores/aaInfo";

const router = useRouter();
const route = useRoute();

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const selectedAA = ref("");
const link = ref("");
const metaByAA = ref(null);
const amount = ref("");
const term = ref("360");
const votedGroupKey = ref("g1");
const percentages = ref("100");

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
  router.push(`/stake/${selectedAA.value}`);
});

watch([amount, term, votedGroupKey, percentages], () => {
  if (!metaByAA.value) return;

  link.value = generateLink(
    amount.value,
    {
      deposit: 1,
      term: Number(term.value),
      voted_group_key: votedGroupKey.value,
      percentages: { a0: Number(percentages.value) },
    },
    null,
    metaByAA.value.staking_aa,
    metaByAA.value.state.asset0,
    true
  );
  console.log({
    deposit: 1,
    term: Number(term.value),
    voted_group_key: votedGroupKey.value,
    percentages: { a0: Number(percentages.value) },
  });
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
      <div class="pt-2">
        <input
          type="text"
          placeholder="Amount"
          v-model="amount"
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
      <div class="pt-2">
        <input
          type="text"
          placeholder="Term"
          v-model="term"
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
      <div class="pt-2">
        <input
          type="text"
          placeholder="Voted group key"
          v-model="votedGroupKey"
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
      <div class="pt-2">
        <input
          type="text"
          placeholder="Percentages"
          v-model="percentages"
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
      <div class="mt-2">
        <a class="btn btn-sm" :href="link">Stake</a>
      </div>
    </div>
  </div>
</template>
