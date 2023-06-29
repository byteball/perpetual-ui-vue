<script setup>
import { computed, ref, watch } from "vue";
import { vMaska } from "maska";

const props = defineProps({ decimals: Number, modelValue: String });

const mask = computed(() => {
  let s = "0";
  if (props.decimals) {
    s += "." + "9".repeat(Number(props.decimals));
  }
  return s;
});
const value = ref("");

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
    v-maska
    :data-maska="mask"
    :placeholder="mask"
    data-maska-tokens="0:\d:multiple|9:\d:optional"
    type="text"
    v-model="value"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped></style>
