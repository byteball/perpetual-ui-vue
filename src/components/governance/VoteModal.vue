<script setup>
import { computed, ref, watch } from "vue";
import { DialogPanel } from "@headlessui/vue";
import {
  formatToRawVotingValue,
  rawToFormatVotingValue,
} from "@/utils/convertValue";
import { isValidNumber } from "@/utils/validates";
import GovernanceAssetField from "@/components/governance/GovernanceAssetField.vue";
import VoteInput from "@/components/inputs/VoteInput.vue";
import TextInput from "@/components/inputs/TextInput.vue";

const props = defineProps(["params"]);
const emit = defineEmits(["vote"]);

const inputValue = ref("");
const isNewValue = !props.params.value;
const inputError = ref("");

if (props.params.value !== undefined) {
  inputValue.value = rawToFormatVotingValue(
    props.params.type,
    props.params.value
  );
}

const leader = computed(() => {
  let l = 0;
  if (props.params.votesByName) {
    props.params.votesByName.forEach((v) => {
      if (v.amount > l) {
        l = v.amount;
      }
    });
  }

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
  if (userVote.vp && userVote.value === +props.params.value) {
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

const isValidValue = computed(() => {
  if (props.params.type === "date" || props.params.type === "percent") {
    return isValidNumber(inputValue.value);
  }

  return inputValue.value !== "";
});

watch(inputValue, () => {
  if (props.params.name === "change_drift_rate") {
    if (inputValue.value > props.params.maxDriftRate) {
      inputError.value = `Max drift rate is ${props.params.maxDriftRate}`;
      return;
    }
  }
  inputError.value = "";
});

function sendVotingEmit() {
  const value = formatToRawVotingValue(props.params.type, inputValue.value);
  emit("vote", props.params.name, value, props.params.priceAsset);
}
</script>

<template>
  <DialogPanel class="w-full max-w-xl rounded-2xl bg-base-200 p-8">
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
            v-if="
              params.type === 'date' ||
              params.type === 'percent' ||
              params.type === 'number'
            "
            v-model="inputValue"
            :type="props.params.type"
            :label="params.suffix"
          />
          <TextInput v-else v-model="inputValue" :label="params.suffix" />
        </label>
        <div v-if="inputError" class="text-red-500">{{ inputError }}</div>
        <div v-else>&nbsp;</div>
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
          name="new_vp"
          :value="vp.newVP"
          :leader="leader"
          :class="{ '!mt-1': !isNewValue }"
        />
      </div>
    </div>
    <div class="form-control text-center">
      <button
        class="btn btn-primary"
        @click="sendVotingEmit"
        :disabled="
          !inputValue || !isValidValue || inputError || Number(inputValue) === 0
        "
      >
        Vote for {{ isNewValue ? "new value" : "value" }}
      </button>
    </div>
  </DialogPanel>
</template>

<style scoped></style>
