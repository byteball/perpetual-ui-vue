<script setup>
import { ref } from "vue";
import FormCreateByUsdOracle from "@/components/create/FormCreateByUsdOracle.vue";
import FormCreateByMyAA from "@/components/create/FormCreateByMyAA.vue";
import BackButtonComponent from "@/components/BackButtonComponent.vue";

defineProps(["reserveAssetSymbol"]);
const emit = defineEmits(["setReservePriceAa", "goBack"]);

const type = ref("");

function setReservePriceAA(aa) {
  emit("setReservePriceAa", aa);
}

function goPrevStep() {
  type.value = "";
}
</script>

<template>
  <div v-if="type === ''">
    <Teleport to="#back_button"
      ><BackButtonComponent @click="$emit('goBack')"
    /></Teleport>
    <div class="mb-6 mt-4 left">
      <div>
        Now we need to create an AA to get the reserve asset price in USD
      </div>
    </div>
    <div class="text-center">
      <div>
        <button class="btn btn-primary mb-4" @click="type = 'oracle'">
          Use USD oracle
        </button>
        <span class="mx-4">or</span>
        <button class="btn btn-primary" @click="type = 'aa'">Use my AA</button>
      </div>
    </div>
  </div>
  <div v-else-if="type === 'oracle'">
    <FormCreateByUsdOracle
      @set-reserve-price-aa="setReservePriceAA"
      @prev-step="goPrevStep"
      :reserve-asset-symbol="reserveAssetSymbol"
    />
  </div>
  <div v-else-if="type === 'aa'">
    <FormCreateByMyAA
      @set-reserve-price-aa="setReservePriceAA"
      @prev-step="goPrevStep"
    />
  </div>
</template>

<style scoped></style>
