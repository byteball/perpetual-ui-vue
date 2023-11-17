<script setup>
import MenuComponent from "@/components/MenuComponent.vue";
import FooterComponent from "@/components/FooterComponent.vue";
</script>

<template>
  <MenuComponent />

  <div tabindex="0">
    <RouterView />
  </div>

  <FooterComponent />
</template>
