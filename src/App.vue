<script setup>
import MenuComponent from "@/components/MenuComponent.vue";
</script>

<template>
  <MenuComponent />

  <div tabindex="0">
    <RouterView />
  </div>
</template>
