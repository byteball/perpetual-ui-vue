<script setup>
import { onMounted, ref } from "vue";
import { getPriceByAssets } from "@/services/PerpAPI";

const props = defineProps([
  "aa",
  "asset0Metadata",
  "priceAa",
  "reservePriceValue",
  "metaByActiveAA",
]);
const price = ref(0);

onMounted(async () => {
  const { asset } = props.asset0Metadata;
  const r = await getPriceByAssets(props.aa, [asset], props.metaByActiveAA);
  price.value = r[asset] * props.reservePriceValue;
});
</script>

<template>
  <div class="card bg-base-300 shadow-xl mb-8">
    <div class="card-body gap-0 p-3 sm:p-8">
      <div>
        <div class="font-medium mb-4">
          {{ asset0Metadata.name }} (Governance asset)
        </div>
        <div class="font-medium text-sm mb-2">
          Decimals:
          <span class="font-light text-sm">
            {{ asset0Metadata.decimals }}
          </span>
        </div>
      </div>
      <div class="font-medium text-sm mb-2">
        Price:
        <span class="font-light text-sm"> ${{ price.toPrecision(6) }} </span>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
