<script setup>
import { computed, ref } from "vue";
import { DialogPanel } from "@headlessui/vue";
import {
  formatToRawVotingValue,
  rawToFormatVotingValue,
} from "@/utils/convertValue";
import { isValidNumber } from "@/utils/validates";
import GovernanceAssetField from "@/components/governance/GovernanceAssetField.vue";
import VoteInput from "@/components/inputs/VoteInput.vue";

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

const leader = computed(() => {
  let l = 0;
  props.params.votesByName.forEach((v) => {
    if (v.amount > l) {
      l = v.amount;
    }
  });

  return Number(
    (l / 10 ** props.params.decimals).toFixed(props.params.decimals)
  );
});

const vp = computed(() => {
  if (isNewValue) {
    return {
      newVP: (props.params.userVP / 10 ** props.params.decimals).toFixed(
        props.params.decimals
      ),
    };
  }
  const currentVp =
    props.params.votesByName.find((v) => v.value === props.params.value)
      ?.amount || 0;

  let newVP = 0 + currentVp;
  const userVote = props.params.userVote;
  if (userVote.vp && userVote.value === props.params.value) {
    newVP -= userVote.vp;
  }
  newVP += props.params.userVP;

  return {
    currentVp: Number(
      (currentVp / 10 ** props.params.decimals).toFixed(props.params.decimals)
    ),
    newVP: Number(
      (newVP / 10 ** props.params.decimals).toFixed(props.params.decimals)
    ),
  };
});

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
      <div>
        <p class="leading-6 font-medium">
          You're going to vote for:
          <span v-if="!isNewValue">{{ inputValue }}{{ params.suffix }}</span>
        </p>
      </div>
      <div class="mt-2 form-control">
        <label v-if="isNewValue" class="input-group">
          <VoteInput
            class="input input-bordered join-item w-full"
            v-model="inputValue"
            :type="props.params.type"
          />
          <span class="join-item">{{ params.suffix }}</span>
        </label>
      </div>
      <div>
        <GovernanceAssetField
          v-if="!isNewValue"
          title="Current VP"
          :value="vp.currentVp"
          class="mt-2"
        />
        <GovernanceAssetField
          title="New VP"
          :value="vp.newVP"
          :leader="leader"
          class="mt-2"
        />
      </div>
    </div>
    <div class="form-control text-center">
      <button
        class="btn btn-primary"
        @click="sendVotingEmit"
        :disabled="!inputValue || !isValidValue || inputValue === '0'"
      >
        Vote for {{ isNewValue ? "new value" : "value" }}
      </button>
    </div>
  </DialogPanel>
</template>

<style scoped></style>
