<script setup>
import { computed, ref, watch } from "vue";
import { vMaska } from "maska";

const props = defineProps({ decimals: Number, modelValue: String });

const options = computed(() => {
  return {
    preProcess: (val) => {
      val = val
        .replace(/,/g, ".")
        .replace(/[^0-9.]/, "")
        .replace(/\.\./g, ".");

      if (val.match(/\./g)?.length > 1) {
        const s = val.split(".");
        const f = s.shift();
        val = f + "." + s.join("");
      }
      return val;
    },
  };
});

const mask = computed(() => {
  let s = "0";
  if (props.decimals) {
    s += "." + "9".repeat(Number(props.decimals));
  }
  return s;
});
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
    v-maska:[options]
    :data-maska="mask"
    :placeholder="mask"
    data-maska-tokens="0:\d:multiple|9:\d:optional"
    type="text"
    v-model="value"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped></style>
