<script setup>
import { computed, ref, watch } from "vue";
import { vMaska } from "maska";
import { classesList } from "@/components/inputs/classesList";

const props = defineProps({
  decimals: Number,
  modelValue: String,
  label: String,
});

const options = computed(() => {
  return {
    preProcess: (val) => {
      if (val[0] === ".") {
        val = "0" + val;
      }

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
const labelBlock = ref();
const paddingRight = computed(() => {
  if (!props.label || !labelBlock.value) return "16px";
  return labelBlock.value.offsetWidth + "px";
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
  <div class="relative w-full">
    <input
      v-maska:[options]
      :data-maska="mask"
      :placeholder="mask"
      data-maska-tokens="0:\d:multiple|9:\d:optional"
      type="text"
      :class="classesList"
      :style="{ paddingRight }"
      v-model="value"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <div
      v-show="label"
      class="flex absolute h-12 right-0 inset-y-0 items-center"
    >
      <div ref="labelBlock" id="test" class="px-4">{{ label }}</div>
    </div>
  </div>
</template>
