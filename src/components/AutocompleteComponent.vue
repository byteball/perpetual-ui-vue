<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import AutoComplete from "@tarekraafat/autocomplete.js";

const props = defineProps(["getSrcForAutoComplete", "modelValue"]);
const emit = defineEmits(["selected", "update:modelValue"]);

const inputRef = ref();
const inputValue = ref("");
const autoComplete = ref();

function keyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const matches = autoComplete.value.feedback
      ? autoComplete.value.feedback.matches
      : [];

    if (!matches.length) return;

    if (autoComplete.value.cursor === -1) {
      emit("update:modelValue", matches[0].value);
      autoComplete.value.close();
      return;
    }

    if (matches[autoComplete.value.cursor]) {
      emit("update:modelValue", matches[autoComplete.value.cursor].value);
    }
  }
}

function initAutoComplete() {
  autoComplete.value = new AutoComplete({
    name: "autoComplete",
    selector: () => inputRef.value,
    submit: true,
    placeHolder: "",
    data: {
      src: props.getSrcForAutoComplete,
      filter: (list) => {
        const inputValue = autoComplete.value.input.value.toLowerCase();
        const mostSimilar = [];
        const similar = list.filter((el) => {
          if (!el.value.toLowerCase().startsWith(inputValue)) {
            return true;
          }

          mostSimilar.push(el);
          return false;
        });

        return [...mostSimilar, ...similar];
      },
    },
    resultsList: {
      maxResults: 30,
    },
    resultItem: {
      highlight: true,
    },
    events: {
      input: {
        selection: (e) => {
          if (e.detail.event.type === "click") {
            emit("update:modelValue", e.detail.selection.value);
          }
        },
      },
    },
  });
}

watch(
  () => props.modelValue,
  () => {
    inputValue.value = props.modelValue;
  },
  { immediate: true }
);

onMounted(() => {
  nextTick(() => {
    initAutoComplete();
    inputRef.value.addEventListener("keydown", keyDown);
  });
});

onUnmounted(() => {
  inputRef.value?.removeEventListener("keydown", keyDown);
});
</script>

<template>
  <input
    type="text"
    ref="inputRef"
    v-model="inputValue"
    @input="$emit('update:modelValue', $event.target.value)"
    class="!input !input-bordered !w-full !text-slate-200 !bg-base-200 !border-gray-600"
  />
</template>

<style scoped></style>
