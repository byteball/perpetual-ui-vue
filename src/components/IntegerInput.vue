<script setup>
const props = defineProps(["inputType", "inputProperty"]);

const handleIntegerInput = (event) => {
  let inputValue = event.target.value.trim();
  const integerPattern = /^-?\d+$/;

  if (!integerPattern.test(inputValue)) {
    inputValue = inputValue.replace(/[^\d]/g, "");
  }

  // eslint-disable-next-line vue/no-mutating-props
  props.inputProperty.value = inputValue;
};

const handleDecimalInput = (event) => {
  let inputValue = event.target.value.trim();
  const numberPattern = /^\d*([.,]?\d+)?$/;
  if (numberPattern.test(inputValue)) {
    // Replace comma with dot as decimal separator
    inputValue = inputValue.replace(",", ".");
  } else {
    // Remove all non-numeric characters except for commas and dots
    inputValue = inputValue.replace(/[^\d.,]/g, "").replace(",", ".");
  }

  // eslint-disable-next-line vue/no-mutating-props
  props.inputProperty.value = inputValue;
};
</script>

<template>
  <input
    type="text"
    v-model="inputProperty.value"
    @input="handleDecimalInput"
    class="input input-bordered"
    :class="{ 'input-error': inputProperty.error }"
  />
</template>
