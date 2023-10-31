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
  const ls = [];
  const ds = [];
  props.data.forEach((v) => {
    ls.push(v.symbol);
    ds.push(v.price);
  });
  return {
    labels: ls,
    datasets: [
      {
        data: ds,
      },
    ],
  };
});

const options = {
  datasets: {
    pie: {
      borderColor: "transparent",
      rotation: 0,
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          console.log(context);
          return `$${context.formattedValue}`;
        },
      },
    },
    legend: {
      position: "top",
      align: "start",
    },
  },
};
</script>

<template>
  <Pie
    class="w-full"
    v-if="Object.keys(props.data).length"
    :data="dataRef"
    :options="options"
  />
</template>

<style scoped></style>
