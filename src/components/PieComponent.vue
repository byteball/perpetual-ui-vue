<script setup>
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import { Pie } from "vue-chartjs";
import { computed } from "vue";

const props = defineProps(["data"]);

ChartJS.register(ArcElement, Tooltip, Legend, Colors);
ChartJS.defaults.color = "#e2e8f0";

const dataRef = computed(() => {
  return {
    labels: [...Object.keys(props.data)],
    datasets: [
      {
        data: [...Object.values(props.data)],
      },
    ],
  };
});

const options = {
  datasets: {
    pie: {
      borderColor: "transparent",
    },
  },
  // borderColor: "transparent",
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          return `$${context.formattedValue}`;
        },
      },
    },
  },
};
</script>

<template>
  <Pie
    v-if="Object.keys(props.data).length"
    :data="dataRef"
    :options="options"
  />
</template>

<style scoped></style>
