<script setup>
import { ref, watch } from "vue";
import { DialogPanel } from "@headlessui/vue";
import { event } from "vue-gtag";

const props = defineProps({
  dataForWithdraw: {
    type: Object,
    required: true,
  },
  assetsMetadata: {
    type: Object,
    required: true,
  },
});

import { generateLink } from "@/utils/generateLink";
import NumberInput from "@/components/inputs/NumberInput.vue";

const withdrawAmount = ref("");
const withdrawError = ref("");
const link = ref("");

function setMyBalance() {
  withdrawAmount.value = props.dataForWithdraw.amount;
}

function withdrawEvent() {
  event("withdraw_presale", {
    event_category: props.dataForWithdraw.aa,
    event_label: props.dataForWithdraw.presaleAsset,
    value: +withdrawAmount.value,
  });
}

watch(withdrawAmount, () => {
  if (+withdrawAmount.value > props.dataForWithdraw.amount) {
    withdrawError.value = "Max amount: " + props.dataForWithdraw.amount;
    link.value = "";
    return;
  }

  if (!+withdrawAmount.value) {
    withdrawError.value = "";
    link.value = "";
    return;
  }

  const data = {
    asset: props.dataForWithdraw.presaleAsset,
    presale: 1,
    withdraw_amount:
      +withdrawAmount.value * 10 ** props.dataForWithdraw.decimals,
  };

  withdrawError.value = "";
  link.value = generateLink(
    10000,
    data,
    null,
    props.dataForWithdraw.aa,
    "base",
    true
  );
});
</script>

<template>
  <DialogPanel class="w-full max-w-xl rounded-2xl bg-base-200 p-8">
    <div class="text-center text-xl font-bold">
      {{
        `Withdraw ${dataForWithdraw.name} from ${
          assetsMetadata[dataForWithdraw.presaleAsset].name
        } presale`
      }}
    </div>
    <div class="mt-8">
      <label class="label">
        <span class="label-text"
          >Amount
          <template v-if="dataForWithdraw.amount > 0">
            <a class="link link-hover text-sky-500" @click="setMyBalance"
              >(Balance: {{ dataForWithdraw.amount }})</a
            ></template
          ></span
        >
      </label>
      <NumberInput
        v-model="withdrawAmount"
        :label="dataForWithdraw.name"
        :decimals="dataForWithdraw.decimals"
      />
    </div>
    <span v-if="withdrawError" class="text-red-500 text-xs mt-2 ml-2">
      {{ withdrawError }}
    </span>
    <div class="form-control mt-6">
      <a
        class="btn btn-primary"
        :class="{ '!btn-disabled': !link }"
        :href="link"
        @click="withdrawEvent"
        >withdraw</a
      >
    </div>
  </DialogPanel>
</template>

<style scoped></style>
