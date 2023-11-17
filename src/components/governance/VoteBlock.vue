<script setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { getParam } from "@/utils/governanceUtils";
import { calcVoteValue } from "@/utils/voteUtils";
import VotingTable from "@/components/governance/VotingTable.vue";
import { useAddressStore } from "@/stores/addressStore";
import { getVPFromNormalized } from "@/utils/getVP";
import { useAaInfoStore } from "@/stores/aaInfo";
import TooltipComponent from "@/components/TooltipComponent.vue";

const props = defineProps([
  "title",
  "name",
  "votesByName",
  "type",
  "preparedMeta",
  "allowedControl",
]);

const emit = defineEmits(["reqVote"]);

const store = useAaInfoStore();
const { timestamp } = storeToRefs(store);
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
    const df = props.preparedMeta.rawMeta["decay_factor"];
    const decimals = props.preparedMeta.asset0SymbolAndDecimals.decimals;
    const vp =
      getVPFromNormalized(vote.vp, df, timestamp.value) / 10 ** decimals;

    return {
      vp: vp.toFixed(decimals),
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
    <div class="block sm:flex justify-between mt-8 font-bold text-lg">
      <div class="text-center sm:text-left flex items-center">
        {{ title }}
        <TooltipComponent
          :field-name="props.name"
          class="ml-1"
        ></TooltipComponent>
      </div>
      <div class="text-left text-base sm:text-lg font-medium sm:font-bold">
        Current value:
        {{ currentValue }}{{ suffix }}
      </div>
    </div>
    <div class="card bg-base-300 shadow-xl mt-2.5">
      <div class="card-body gap-0 p-3 sm:p-8">
        <div class="text-center">
          <div v-if="votesByName?.length">
            <div class="mb-2 font-bold text-left">
              Votes for changing the value
            </div>
            <div class="w-full overflow-auto">
              <VotingTable
                :votes="votesByName"
                :type="type"
                :suffix="suffix"
                :decimals="preparedMeta.asset0SymbolAndDecimals.decimals"
                :allowed-control="allowedControl"
                :user-voting-power="userVote.vp"
                @vote-from-table="voteFromTable"
              />
            </div>
            <div v-if="userVote?.vp" class="mt-2 text-left">
              You vote for
              <span class="font-bold">{{ userVote.value }}{{ suffix }}</span>
              (vp: {{ userVote.vp }})
            </div>
          </div>
          <div v-else class="text-center">
            No votes for changing this value yet
          </div>
          <div class="text-center sm:text-left mt-4" v-if="allowedControl">
            <a
              class="link text-sky-500 link-hover"
              @click="$emit('reqVote', name, type, suffix)"
              >suggest {{ votesByName?.length ? "another" : "new" }} value</a
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
