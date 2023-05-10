<script setup>
import { RouterView, useRoute } from "vue-router";
const route = useRoute();
</script>

<template>
  <header>
    <nav class="menu">
      <RouterLink
        to="/"
        class="btn btn-outline btn-sm"
        :class="{ 'btn-active': route.name === 'market' }"
        >Market</RouterLink
      >
      <RouterLink
        to="/stake"
        class="btn btn-outline btn-sm ml-4"
        :class="{ 'btn-active': route.name === 'stake' }"
        >Stake</RouterLink
      >
      <RouterLink
        to="/governance"
        class="btn btn-outline btn-sm ml-4"
        :class="{ 'btn-active': route.name === 'governance' }"
        >Governance</RouterLink
      >
      <RouterLink
        to="/presale"
        class="btn btn-outline btn-sm ml-4"
        :class="{ 'btn-active': route.name === 'presale' }"
        >Presale</RouterLink
      >
      <RouterLink
        to="/create"
        class="btn btn-outline btn-sm ml-4"
        :class="{
          'btn-active':
            route.name === 'create' || route.name === 'createSymbols',
        }"
        >Create</RouterLink
      >
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>
.menu {
  flex-direction: row;
  padding: 16px;
}
</style>
