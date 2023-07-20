<script setup>
import { computed, ref, watch } from "vue";
import { vMaska } from "maska";

const props = defineProps(["modelValue"]);

const value = ref("");

const options = computed(() => {
  return {
    preProcess: (val) => {
      return val.replace(/,/g, ".").replace(/[^0-9.]/);
    },
  };
});

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
    v-maska:[options]
    data-maska="0"
    placeholder="1"
    data-maska-tokens="0:\d:multiple"
    type="text"
    v-model="value"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped></style>
