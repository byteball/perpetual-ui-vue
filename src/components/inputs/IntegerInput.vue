<script setup>
import { computed, ref, watch } from "vue";
import { vMaska } from "maska";
import { classesList } from "@/components/inputs/classesList";

const props = defineProps(["modelValue", "maxValue"]);

const value = ref("");

const options = computed(() => {
  return {
    preProcess: (val) => {
      val = val.replace(/,/g, ".").replace(/[^0-9.]/, "");
      if (val.startsWith("0")) {
        val = val.replace(/^0+/, "");
      }

      if (/^0[1-9]/.test(val)) {
        val = val.replace(/^0+/, "");
      }

      return val;
    },
    postProcess: (val) => {
      if (!props.maxValue) return val;

      if (val > props.maxValue) {
        return props.maxValue;
      }

      return val;
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
    :class="classesList"
    v-model="value"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped></style>
