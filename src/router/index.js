import { createRouter, createWebHistory } from "vue-router";
import MarketView from "../views/MarketView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "market",
      component: MarketView,
    },
    {
      path: "/stake/:aa(.*)?",
      name: "stake",
      component: () => import("../views/StakeView.vue"),
    },
    {
      path: "/governance",
      name: "governance",
      component: () => import("../views/GovernanceView.vue"),
    },
    {
      path: "/governance/management/:aa",
      name: "governanceManagement",
      component: () => import("../views/GovernanceManagementView.vue"),
    },
    {
      path: "/addPerp/:aa",
      name: "addPerp",
      component: () => import("../views/AddPerpView.vue"),
    },
    {
      path: "/presale/:presale(.*)?",
      name: "presale",
      component: () => import("../views/PresaleView.vue"),
    },
    {
      path: "/create/:aa",
      name: "createSymbols",
      component: () => import("../views/CreateSymbols.vue"),
    },
    {
      path: "/create",
      name: "create",
      component: () => import("../views/CreateView.vue"),
    },
  ],
  scrollBehavior() {
    return { top: 0, behavior: "smooth" };
  },
});

export default router;
