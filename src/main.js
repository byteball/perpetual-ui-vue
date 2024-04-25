import { createApp } from "vue";
import { createPinia } from "pinia";
import FloatingVue from "floating-vue";
import VueGtag from "vue-gtag";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors,
  ArcElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

import App from "./App.vue";
import router from "./router";

import "./style.css";
import "floating-vue/dist/style.css";

import "@/services/Obyte";

FloatingVue.options.themes.tooltip.triggers = [
  "click",
  "hover",
  "focus",
  "touch",
];

ChartJS.register(
  ArcElement,
  ChartDataLabels,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors
);
ChartJS.defaults.color = "#e2e8f0";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(
  VueGtag,
  {
    appName: "Pythagorean - perpetual futures",
    pageTrackerScreenviewEnabled: true,
    config: { id: import.meta.env.VITE_GA },
  },
  router
);

app.mount("#app");
