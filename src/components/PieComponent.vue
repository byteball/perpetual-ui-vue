<script setup>
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "vue-chartjs";
import { onMounted, ref } from "vue";

const props = defineProps(["data"]);

const dataRef = ref({
  labels: [],
  datasets: [
    {
      data: [],
    },
  ],
});

onMounted(() => {});
</script>

<template>
  <Pie :data="dataRef" />
</template>

<style scoped></style>
