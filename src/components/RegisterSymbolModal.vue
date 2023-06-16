<script setup>
import { ref, watch } from "vue";
import { DialogPanel } from "@headlessui/vue";
import { generateLink } from "@/utils/generateLink";

const props = defineProps(["asset", "perpAa"]);

const symbol = ref("");
const decimals = ref(0);
const buttonEnabled = ref(false);
const link = ref("");

watch([symbol, decimals], () => {
  buttonEnabled.value = false;

  if (!symbol.value) {
    return;
  }

  if (decimals.value === "") {
    return;
  }

  link.value = generateLink(
    100000000,
    {
      asset: props.asset,
      symbol: symbol.value,
      decimals: decimals.value,
      description: `Asset for perpetual futures AA ${props.perpAa}`,
    },
    null,
    import.meta.env.VITE_REGISTRY_AA,
    "base",
    true
  );

  buttonEnabled.value = true;
});
</script>

<template>
  <DialogPanel class="w-full max-w-lg rounded bg-base-200 p-8">
    <div class="text-center text-2xl font-bold">
      Register a symbol for asset
    </div>
    <div class="form-control mt-4">
      <label class="label">
        <span class="label-text">Asset</span>
      </label>
      <input
        type="text"
        :value="asset"
        class="input input-bordered input-sm"
        readonly
      />
    </div>
    <div class="form-control mt-2">
      <label class="label">
        <span class="label-text">Symbol</span>
      </label>
      <input
        type="text"
        v-model="symbol"
        @input="() => (symbol = symbol.toUpperCase())"
        class="input input-bordered input-sm"
      />
    </div>
    <div class="form-control mt-2">
      <label class="label">
        <span class="label-text">Decimals</span>
      </label>
      <input
        type="number"
        v-model="decimals"
        min="0"
        class="input input-bordered input-sm"
      />
    </div>
    <div class="form-control mt-6">
      <a
        class="btn btn-primary btn-sm"
        :href="link"
        :class="{ '!btn-disabled': !buttonEnabled }"
        >Register symbol</a
      >
    </div>
  </DialogPanel>
</template>

<style scoped></style>
