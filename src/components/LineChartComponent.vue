<script setup>
import { computed } from "vue";
import { Line } from "vue-chartjs";
import { formatIsoDate } from "@/utils/formatIsoDate";

const props = defineProps(["data", "name", "period"]);

const dataRef = computed(() => {
  const ls = [];
  const ds = [];

  let i = 6;
  props.data.forEach((v) => {
    if (props.period === "1W" && i < 5) {
      i++;
      return;
    }
    const date = props.period === "1W" ? formatIsoDate(v.date) : v.date;
    ls.push(date);
    ds.push(v.price);
    i = 0;
  });

  return {
    labels: ls,
    datasets: [
      {
        label: props.name || "-",
        data: ds,
        fill: false,
        borderColor: "rgb(75,139,192)",
        tension: 0.1,
      },
    ],
  };
});

const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
  },
  scales: {
    x: {
      display: true,
      ticks: {
        callback: function (_v, index) {
          if (props.period === "1W") {
            return index % 2 !== 0 ? dataRef.value.labels[index] : "";
          }

          return dataRef.value.labels[index];
        },
      },
    },
    y: {
      display: true,
    },
  },
  plugins: {
    legend: false,
    tooltip: {
      boxWidth: 0,
      boxHeight: 0,
      boxPadding: 0,
      callbacks: {
        label: function (ctx) {
          return `$${ctx.formattedValue}`;
        },
      },
    },
    datalabels: {
      display: false,
    },
  },
};
</script>

<template>
  <div class="relative">
    <Line v-show="data.length" :data="dataRef" :options="options" />
  </div>
</template>

<style scoped></style>
