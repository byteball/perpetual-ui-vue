<script setup>
import { computed, ref } from "vue";
import { DialogPanel } from "@headlessui/vue";
import {
  formatToRawVotingValue,
  rawToFormatVotingValue,
} from "@/utils/convertValue";
import { isValidNumber } from "@/utils/validates";

const props = defineProps(["params"]);
const emit = defineEmits(["vote"]);
const inputValue = ref("");
const isNewValue = !props.params.value;

if (props.params.value !== undefined) {
  inputValue.value = rawToFormatVotingValue(
    props.params.type,
    props.params.value
  );
}

const isValidValue = computed(() => isValidNumber(inputValue.value));

function sendVotingEmit() {
  const value = formatToRawVotingValue(props.params.type, inputValue.value);
  emit("vote", props.params.name, value);
}
</script>

<template>
  <DialogPanel class="w-full max-w-lg rounded bg-base-200 p-8">
    <div class="text-center text-2xl font-bold">{{ params.title }}</div>
    <div class="mt-8 mb-8">
      <div class="form-control">
        <label class="input-group">
          <input
            class="input input-bordered join-item w-full"
            placeholder="value"
            v-model="inputValue"
            :disabled="!isNewValue"
          />
          <span class="join-item">{{ params.suffix }}</span>
        </label>
      </div>
    </div>
    <div class="text-center">
      <button
        class="btn btn-primary"
        @click="sendVotingEmit"
        :disabled="!inputValue || !isValidValue"
      >
        Vote for {{ isNewValue ? "new value" : "value" }}
      </button>
    </div>
  </DialogPanel>
</template>

<style scoped></style>
