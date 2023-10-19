<script setup>
import { computed, onMounted, ref, useAttrs, watch } from "vue";
import { classesList } from "@/components/inputs/classesList";
import TooltipComponent from "@/components/TooltipComponent.vue";

const props = defineProps([
  "modelValue",
  "staticValue",
  "label",
  "placeholder",
  "labelAttribute",
  "tooltipName",
]);
const attrs = useAttrs();

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

onMounted(() => {
  if (!props.modelValue && props.staticValue) {
    value.value = props.staticValue;
  }
});
</script>

<template>
  <div class="relative w-full">
    <template v-if="labelAttribute">
      <div class="flex items-center">
        <label class="label">
          <span class="label-text">{{ labelAttribute }}</span>
        </label>
        <TooltipComponent v-if="tooltipName" :field-name="tooltipName" />
      </div>
    </template>
    <input
      type="text"
      :class="classesList"
      :style="{ paddingRight }"
      :placeholder="placeholder || ''"
      v-model="value"
      @input="$emit('update:modelValue', $event.target.value)"
      :readonly="staticValue || attrs.readonly !== undefined"
    />
    <div
      v-show="label"
      class="flex absolute h-12 right-0 inset-y-0 items-center"
    >
      <div ref="labelBlock" id="test" class="px-4">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped></style>
