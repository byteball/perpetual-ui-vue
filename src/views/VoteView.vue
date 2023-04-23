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
const name = ref("add_price_aa");
const price_aa = ref("JA45YEA4OZABI3T4O3DHWBQHVAFEEX44");
const value = ref("yes");

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
  if (!selectedAA.value) return;
  router.push(`/vote/${selectedAA.value}`);
});

watch(
  [metaByAA, name, price_aa, value],
  () => {
    if (!metaByAA.value) return;

    link.value = generateLink(
      10000,
      {
        vote_value: 1,
        name: name.value,
        price_aa: price_aa.value,
        value: value.value,
      },
      null,
      metaByAA.value.staking_aa,
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
  <div
    v-if="aas.length"
    class="container w-[320px] sm:w-[512px] m-auto mt-40 mb-36 p-8"
  >
    <div class="form">
      <div>
        <select class="select select-bordered mb-4 w-full" v-model="selectedAA">
          <option value="" disabled>Please select aa</option>
          <option v-for="aa in aas" :key="aa" :value="aa">{{ aa }}</option>
        </select>
      </div>
      <div v-show="!metaByAA">Waiting...</div>
      <div v-show="metaByAA">
        <div class="pt-2">
          <input
            type="text"
            placeholder="Name"
            v-model="name"
            class="input input-bordered w-full"
          />
        </div>
        <div class="pt-2">
          <input
            type="text"
            placeholder="Price aa"
            v-model="price_aa"
            class="input input-bordered w-full"
          />
        </div>
        <div class="pt-2">
          <input
            type="text"
            placeholder="Value"
            v-model="value"
            class="input input-bordered w-full"
          />
        </div>
        <div class="mt-2">
          <a class="btn btn-sm" :href="link">Vote</a>
        </div>
      </div>
    </div>
  </div>
</template>
