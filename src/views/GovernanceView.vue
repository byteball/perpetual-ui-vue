<script setup>
import { onMounted, ref, watch } from "vue";
import { useAaInfoStore } from "@/stores/aaInfo";
import { storeToRefs } from "pinia";
import { getAssetMetadata } from "@/services/DAGApi";
import { useRouter } from "vue-router";

const router = useRouter();

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const aasWithMeta = ref({});

async function init() {
  if (!aas.value.length) return;

  const m = {};
  for (let aa in meta.value) {
    m[aa] = {
      symbolAndDecimals: await getAssetMetadata(meta.value[aa].state.asset0),
    };
  }

  aasWithMeta.value = m;
}

function goToAddPerp(aa) {
  router.push({ name: "addPerp", params: { aa } });
}

onMounted(init);
watch(meta, init, { deep: true });
</script>
<template>
  <div
    v-if="Object.keys(aasWithMeta).length"
    class="container w-[320px] sm:w-[512px] m-auto mt-40 mb-36 p-8"
  >
    <div
      v-for="(meta, aa) in aasWithMeta"
      :key="aa"
      class="border border-gray-300 rounded-md p-2.5"
    >
      <div class="text-sm">{{ meta.symbolAndDecimals.name }}</div>
      <div class="mt-4">
        <a class="link" @click="goToAddPerp(aa)">Add a perp for voting</a>
      </div>
    </div>
  </div>
  <div
    v-else
    class="container w-[320px] sm:w-[512px] m-auto mt-40 mb-36 p-8 text-center"
  >
    <button
      class="btn btn-outline btn-circle btn-lg loading border-none"
    ></button>
  </div>
</template>
