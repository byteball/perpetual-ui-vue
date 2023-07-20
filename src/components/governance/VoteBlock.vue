<script setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { getParam } from "@/utils/governanceUtils";
import { calcVoteValue } from "@/utils/voteUtils";
import VotingTable from "@/components/governance/VotingTable.vue";
import { useAddressStore } from "@/stores/addressStore";

const props = defineProps([
  "title",
  "name",
  "votesByName",
  "type",
  "preparedMeta",
]);

const emit = defineEmits(["reqVote"]);

const addressStore = useAddressStore();
const { address } = storeToRefs(addressStore);

const suffix = ref("");
const currentValue = ref(getParam(props.name, props.preparedMeta.rawMeta));

suffix.value = props.type === "date" ? " days" : "%";
currentValue.value = calcVoteValue(currentValue.value, props.type);

const userVote = computed(() => {
  const stakingVars = props.preparedMeta.rawMeta.stakingVars;
  const vote = stakingVars[`user_value_votes_${address.value}_${props.name}`];

  if (vote) {
    return {
      vp: vote.vp / 10 ** props.preparedMeta.symbolAndDecimals.decimals,
      value: calcVoteValue(vote.value, props.type),
    };
  } else {
    return { vp: 0, value: 0 };
  }
});

function voteFromTable(value) {
  emit("reqVote", props.name, props.type, suffix.value, value);
}
</script>

<template>
  <div class="mb-8">
    <div class="flex justify-between mt-8 font-bold text-lg">
      <div>{{ title }}</div>
      <div>
        Current value:
        {{ currentValue }}{{ suffix }}
      </div>
    </div>
    <div class="card bg-base-300 shadow-xl mt-2.5">
      <div class="card-body gap-0">
        <div class="text-center">
          <div v-if="votesByName?.length" class="mb-4">
            <VotingTable
              :votes="votesByName"
              :type="type"
              :suffix="suffix"
              :decimals="preparedMeta.symbolAndDecimals.decimals"
              @vote-from-table="voteFromTable"
            />
            <div v-if="userVote.vp" class="mt-2">
              You vote for
              <span class="font-bold">{{ userVote.value }}{{ suffix }}</span>
              (vp: {{ userVote.vp }})
            </div>
          </div>
          <div class="text-left">
            <a
              class="link text-sky-500 link-hover"
              @click="$emit('reqVote', name, type, suffix)"
              >suggest another value</a
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
