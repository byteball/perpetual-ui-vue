<script setup>
import { RouterView } from "vue-router";
</script>

<template>
  <header>
    <nav class="menu">
      <RouterLink to="/buy">Buy</RouterLink>
      <RouterLink to="/sell">Sell</RouterLink>
      <RouterLink to="/stake">Stake</RouterLink>
      <RouterLink to="/vote">Vote</RouterLink>
      <RouterLink to="/presale">Presale</RouterLink>
      <RouterLink to="/create">Create</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>
.menu {
  flex-direction: row;
}

.menu > a {
  @apply link;
  margin-left: 8px;
}
</style>
