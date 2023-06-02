<script setup>
import { RouterView, useRoute } from "vue-router";
const route = useRoute();
</script>

<template>
  <header>
    <div class="navbar bg-base-100">
      <div class="navbar-start">
        <div class="dropdown">
          <label tabindex="0" class="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </label>
          <ul
            tabindex="0"
            class="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-50"
          >
            <li>
              <RouterLink
                to="/"
                :class="{ 'btn-active': route.name === 'market' }"
                >Market</RouterLink
              >
            </li>
            <li>
              <RouterLink
                to="/stake"
                :class="{ 'btn-active': route.name === 'stake' }"
                >Stake</RouterLink
              >
            </li>
            <li>
              <RouterLink
                to="/governance"
                :class="{ 'btn-active': route.name === 'governance' }"
                >Governance</RouterLink
              >
            </li>
            <li>
              <RouterLink
                to="/presale"
                :class="{ 'btn-active': route.name === 'presale' }"
                >Presale</RouterLink
              >
            </li>
            <li>
              <RouterLink
                to="/create"
                :class="{
                  'btn-active':
                    route.name === 'create' || route.name === 'createSymbols',
                }"
                >Create</RouterLink
              >
            </li>
          </ul>
        </div>
        <a class="btn btn-ghost normal-case text-xl">Perpetual</a>
      </div>
      <div class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal px-1">
          <li>
            <RouterLink
              to="/"
              :class="{ 'btn-active': route.name === 'market' }"
              >Market</RouterLink
            >
          </li>
          <li>
            <RouterLink
              to="/stake"
              class="ml-2"
              :class="{ 'btn-active': route.name === 'stake' }"
              >Stake</RouterLink
            >
          </li>
          <li>
            <RouterLink
              to="/governance"
              class="ml-2"
              :class="{ 'btn-active': route.name === 'governance' }"
              >Governance</RouterLink
            >
          </li>
          <li>
            <RouterLink
              to="/presale"
              class="ml-2"
              :class="{ 'btn-active': route.name === 'presale' }"
              >Presale</RouterLink
            >
          </li>
          <li>
            <RouterLink
              to="/create"
              class="ml-2"
              :class="{
                'btn-active':
                  route.name === 'create' || route.name === 'createSymbols',
              }"
              >Create</RouterLink
            >
          </li>
        </ul>
      </div>
      <div class="navbar-end"></div>
    </div>
    <nav class="menu"></nav>
  </header>

  <RouterView />
</template>

<style scoped>
.menu {
  flex-direction: row;
  padding: 16px;
}
</style>
