<script setup>
import { computed } from "vue";

const props = defineProps(["fee", "withDiff"]);
const absFee = computed(() => Math.abs(props.fee));
console.log(absFee);
</script>

<template>
  <span
    :class="{
      'text-yellow-500': absFee > 5 && absFee < 15,
      'text-red-500': absFee > 15,
    }"
    ><template v-if="withDiff && fee > 0">+</template
    >{{ +fee.toPrecision(6) }}%</span
  >
</template>

<style scoped></style>
