<script setup>
import { ref, watch } from "vue";
import { generateLink } from "@/utils/generateLink";

const link = ref("");
const reserveAsset = ref("base");
const swapFee = ref("0.003");
const arbProfitTax = ref("0.9");

watch(
  [reserveAsset, swapFee, arbProfitTax],
  () => {
    link.value = generateLink(
      10000,
      {
        reserve_asset: reserveAsset.value,
        swap_fee: swapFee.value,
        arb_profit_tax: arbProfitTax.value,
      },
      null,
      import.meta.env.VITE_FACTORY_AA,
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
  <div class="form">
    <div>
      <div class="pt-2">
        <input
          type="text"
          placeholder="Reserve asset"
          v-model="reserveAsset"
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
      <div class="pt-2">
        <input
          type="text"
          placeholder="Swap fee"
          v-model="swapFee"
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
      <div class="pt-2">
        <input
          type="text"
          placeholder="Arb profit tax"
          v-model="arbProfitTax"
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
      <div class="mt-2">
        <a class="btn btn-sm" :href="link">Create</a>
      </div>
    </div>
  </div>
</template>
