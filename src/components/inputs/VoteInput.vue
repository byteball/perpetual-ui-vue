<script setup>
import { computed, ref, watch } from "vue";
import { vMaska } from "maska";

const props = defineProps({ type: String, modelValue: String });

const value = ref("");

const options = computed(() => {
  return {
    postProcess: (val) => {
      if (props.type === "percent" && val > 100) {
        return 100;
      }

      return val;
    },
  };
});

watch(
  props.modelValue,
  () => {
    value.value = props.modelValue;
  },
  { immediate: true }
);
</script>

<template>
  <input
    v-maska:[options]
    placeholder="value"
    data-maska="0"
    data-maska-tokens="0:\d:multiple"
    type="text"
    v-model="value"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped></style>
