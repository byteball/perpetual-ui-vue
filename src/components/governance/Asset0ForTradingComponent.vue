<script setup>
import { onMounted, ref } from "vue";
import { fullExplorerUrlForAddress } from "@/config";
import { getPriceByAssets } from "@/services/PerpAPI";
import TooltipComponent from "@/components/TooltipComponent.vue";

const props = defineProps([
  "aa",
  "asset0Metadata",
  "priceAa",
  "reservePriceValue",
]);
const price = ref(0);

onMounted(async () => {
  const { asset } = props.asset0Metadata;
  const r = await getPriceByAssets(props.aa, [asset]);
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
        Status:
        <span class="font-light text-sm"> trading </span>
      </div>
      <div
        class="card-actions sm:justify-start block sm:flex text-center sm:text-left"
      >
        <div class="divider w-full"></div>
        <div class="text-sm w-full">
          <div class="font-bold text-lg flex items-center">
            Price aa
            <TooltipComponent class="inline-block ml-1" field-name="price_aa">
            </TooltipComponent>
          </div>
          <div class="mt-2">
            Current value:
            <a
              class="link text-sky-500 link-hover block sm:inline-block text-xs sm:text-sm"
              target="_blank"
              :href="fullExplorerUrlForAddress + priceAa"
              >{{ priceAa }}</a
            >
          </div>
          <div>
            <div class="mt-1">Target price: ${{ reservePriceValue }}</div>
            <div class="mt-1">Price: ${{ price }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
