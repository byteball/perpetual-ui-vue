<script setup>
import MathJax from "vue-mathjax-v3";
defineProps(["formula"]);
</script>

<template>
  <MathJax :formula="formula" />
</template>

<style scoped></style>
