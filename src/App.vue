<script setup>
import MenuComponent from "@/components/MenuComponent.vue";
import FooterComponent from "@/components/FooterComponent.vue";
</script>

<template>
  <MenuComponent />

  <div tabindex="0">
    <RouterView />
  </div>
  <div class="h-[34rem] sm:h-96"></div>
  <FooterComponent />
</template>
