<script setup>
import VueMathjax from "vue-mathjax-next";
defineProps(["formula"]);
</script>

<template>
  <VueMathjax
    class="my-4"
    :formula="formula"
    :options="{
      showMathMenu: false,
      displayAlign: 'left',
      ['HTML-CSS']: {
        styles: { '.MathJax_Display': { margin: 0, display: 'inline' } },
        linebreaks: { automatic: true },
      },
    }"
  />
</template>

<style scoped></style>
