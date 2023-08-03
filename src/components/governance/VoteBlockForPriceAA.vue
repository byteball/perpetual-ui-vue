<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { fullExplorerUrlForAddress } from "@/config";
import { getVPFromNormalized } from "@/utils/getVP";
import { useAaInfoStore } from "@/stores/aaInfo";
import { useAddressStore } from "@/stores/addressStore";
import VotingTable from "@/components/governance/VotingTable.vue";

const props = defineProps([
  "title",
  "name",
  "type",
  "assetMeta",
  "votesByName",
]);
const emit = defineEmits(["reqVote"]);
const currentValue = props.assetMeta[props.name] || 0;

const store = useAaInfoStore();
const { metaByActiveAddress, timestamp } = storeToRefs(store);
const addressStore = useAddressStore();
const { address } = storeToRefs(addressStore);

const userVote = computed(() => {
  if (!metaByActiveAddress.value) return;
  const stakingVars = metaByActiveAddress.value.stakingVars;
  const vote =
    stakingVars[
      `user_value_votes_${address.value}_change_price_aa${props.assetMeta.assetMetaData.asset}`
    ];

  if (vote) {
    const df = metaByActiveAddress.value["decay_factor"];
    const decimals = props.assetMeta.assetMetaData.decimals;
    const vp =
      getVPFromNormalized(vote.vp, df, timestamp.value) / 10 ** decimals;

    return {
      vp: vp.toFixed(decimals),
      value: vote.value,
    };
  } else {
    return { vp: 0, value: 0 };
  }
});

function voteFromTable(value) {
  emit("reqVote", props.name, props.type, value);
}
</script>

<template>
  <div class="text-sm mt-4">
    <div class="font-bold text-lg">{{ title }}</div>
    <div class="mt-2">
      Current value:
      <a
        v-if="type === 'address'"
        class="link underline block sm:inline-block text-xs sm:text-sm"
        target="_blank"
        :href="fullExplorerUrlForAddress + currentValue"
        >{{ currentValue }}</a
      >
      <span v-else>{{ currentValue }}</span>
    </div>
    <div class="mt-2">
      <div v-if="votesByName?.length" class="mb-4">
        <div class="overflow-auto">
          <VotingTable
            :votes="votesByName"
            :decimals="assetMeta.assetMetaData.decimals"
            @vote-from-table="voteFromTable"
          />
        </div>
        <div v-if="userVote?.vp" class="mt-2 text-center">
          You vote for
          <span class="font-normal sm:font-bold text-xs sm:text-sm">{{
            userVote.value
          }}</span>
          (vp: {{ userVote.vp }})
        </div>
      </div>
      <div class="text-center sm:text-left">
        <a
          class="link text-sky-500 link-hover"
          @click="$emit('reqVote', name, type)"
          >suggest another value</a
        >
      </div>
    </div>
  </div>
</template>

<style scoped></style>
