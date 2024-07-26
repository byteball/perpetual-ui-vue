<script setup>
import { ref, watch } from "vue";
import TextInput from "@/components/inputs/TextInput.vue";
import { isValidAddress } from "@/utils/validates";
import { executeAAGetter } from "@/services/DAGApi";
import BackButtonComponent from "@/components/BackButtonComponent.vue";

const emit = defineEmits(["setReservePriceAa", "prevStep"]);

const address = ref("");
const isValidAddr = ref(false);
const awaiting = ref(false);
const errorMessage = ref("");

async function checkGetterInAA() {
  awaiting.value = true;
  const targetPrice = await executeAAGetter(
    address.value,
    "get_reserve_price",
    [],
    true
  );
  if (targetPrice.error) {
    if (targetPrice.error.startsWith("remote AA not found")) {
      errorMessage.value = "This address is not AA";
    } else if (targetPrice.error.startsWith("no such getter")) {
      errorMessage.value = "Getter get_target_price not found";
    } else {
      errorMessage.value = targetPrice.error;
    }
    console.error(targetPrice.error);
    awaiting.value = false;
    return;
  }

  if (typeof targetPrice === "number") {
    emit("setReservePriceAa", address.value);
  } else {
    errorMessage.value = "AA returned not a number";
  }
  awaiting.value = false;
}

watch(address, () => {
  isValidAddr.value = isValidAddress(address.value);
  errorMessage.value = "";
});
</script>

<template>
  <Teleport to="#back_button"
    ><BackButtonComponent @click="$emit('prevStep')"
  /></Teleport>
  <div class="mb-6">
    <div>AA requirements:</div>
    <div class="mt-1 mb-2">
      <div>- must have a getter $get_reserve_price()</div>
      <div>- the getter must return the price in dollars</div>
    </div>
    <a
      href="https://github.com/byteball/perpetual-aa/blob/master/reserve_price_example.oscript"
      target="_blank"
      class="link text-sky-500 link-hover"
      rel="noopener"
      >Example AA</a
    >
    &nbsp;
    <a
      href="https://developer.obyte.org/autonomous-agents"
      target="_blank"
      class="link text-sky-500 link-hover"
      rel="noopener"
      >Docs</a
    >
  </div>
  <div>
    <TextInput placeholder="Address of your AA" v-model="address" />
  </div>
  <div class="my-2 text-red-500" v-if="errorMessage">{{ errorMessage }}</div>
  <div class="text-center">
    <button
      class="btn btn-primary mt-4"
      :class="{ '!btn-disabled': !isValidAddr || awaiting }"
      @click="checkGetterInAA"
    >
      Create reserve price AA
    </button>
  </div>
</template>

<style scoped></style>
