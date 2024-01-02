<script setup>
import { computed, ref, watch } from "vue";
import { vMaska } from "maska";
import { classesList } from "@/components/inputs/classesList";

const props = defineProps({
  type: String,
  modelValue: String,
  label: String,
});

let decimals = 0;
let placeholder = "10";
if (props.type === "percent") {
  decimals = 2;
  placeholder = "0.03";
} else if (props.type === "date") {
  decimals = 3;
  placeholder = "30";
}

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

      if (val.startsWith("00")) {
        val = val.replace(/^0+/, "0");
      }

      if (/^0[1-9]/.test(val)) {
        val = val.replace(/^0+/, "");
      }
      return val;
    },
  };
});

const mask = computed(() => {
  let s = "0";
  if (decimals) {
    s += "." + "9".repeat(Number(decimals));
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
      :placeholder="placeholder"
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
