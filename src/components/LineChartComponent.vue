<script setup>
import { computed } from "vue";
import { Line } from "vue-chartjs";
import { formatIsoDate } from "@/utils/formatIsoDate";
import { getDay, getTime } from "@/utils/dateFormat";

const props = defineProps(["data", "name", "period"]);

const dataRef = computed(() => {
  const ls = [];
  const ds = [];

  let i = 0;
  let lastDay = 0;
  props.data.forEach((v, idx) => {
    const date = props.period === "1W" ? formatIsoDate(v.date) : v.date;
    if (props.period === "1W") {
      const day = new Date(date).getDate();
      if (day !== lastDay || idx === props.data.length - 1) {
        i = 0;
        lastDay = day;
        ls.push(date);
        ds.push(v.price);
        return;
      }

      i++;
      if (i % 5 === 0) {
        ls.push(date);
        ds.push(v.price);
      }
      return;
    }

    // 1M
    ls.push(date);
    ds.push(v.price);
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
          const date = dataRef.value.labels[index];
          if (props.period === "1M") {
            return index % 2 !== 0 ? "" : getDay(date);
          }

          // 1W
          if (index === 0) {
            return getDay(date);
          }

          const oldDate = new Date(dataRef.value.labels[index - 1]);
          const newDate = new Date(date);
          if (oldDate.getDay() !== newDate.getDay()) {
            return getDay(date);
          }

          return getTime(date);
        },
        maxRotation: 0,
        minRotation: 0,
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
