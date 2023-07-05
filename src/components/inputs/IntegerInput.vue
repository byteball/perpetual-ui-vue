<script setup>
import { ref, watch } from "vue";
import { vMaska } from "maska";

const props = defineProps(["modelValue"]);

const value = ref("");

watch(
  () => props.modelValue,
  () => {
    value.value = props.modelValue;
  },
  { immediate: true }
);
</script>

<template>
  <input
    v-maska
    data-maska="0"
    placeholder="1"
    data-maska-tokens="0:\d:multiple"
    type="text"
    v-model="value"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped></style>
