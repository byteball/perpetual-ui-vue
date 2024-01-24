<script setup>
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { fullExplorerUrlForAddress } from "@/config";
import { getVPFromNormalized } from "@/utils/getVP";
import { useAaInfoStore } from "@/stores/aaInfo";
import { useAddressStore } from "@/stores/addressStore";
import VotingTable from "@/components/governance/VotingTable.vue";
import TooltipComponent from "@/components/TooltipComponent.vue";
import {
  getPriceByAssets,
  getReservePriceFromPerpAA,
  getTargetPriceByPriceAa,
} from "@/services/PerpAPI";
import { getDefinition } from "@/services/DAGApi";
import dayjs from "dayjs";
import { getChallengingPeriod } from "@/utils/governanceUtils";
import { calcVoteValue } from "@/utils/voteUtils";

const props = defineProps([
  "perpAa",
  "title",
  "name",
  "type",
  "assetMeta",
  "reserveAssetMeta",
  "votesByName",
  "allowedControl",
  "metaByActiveAA",
]);
const emit = defineEmits(["reqVote"]);
const currentValue =
  calcVoteValue(props.assetMeta[props.name], props.type) || 0;
let suffix = "";
if (props.type === "date") {
  suffix = " days";
} else if (props.type === "percent") {
  suffix = "%";
}

const store = useAaInfoStore();
const { metaByActiveAddress, timestamp } = storeToRefs(store);
const addressStore = useAddressStore();
const { address } = storeToRefs(addressStore);

const selectedOracleData = ref({});
const price = ref(0);

const userVote = computed(() => {
  if (!metaByActiveAddress.value) return;
  const stakingVars = metaByActiveAddress.value.stakingVars;
  const vote =
    stakingVars[
      `user_value_votes_${address.value}_change_${props.name}${props.assetMeta.assetMetaData.asset}`
    ];

  if (vote) {
    const df = metaByActiveAddress.value["decay_factor"];
    const decimals = props.reserveAssetMeta.decimals;
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

const leaderDate = computed(() => {
  const stakingVars = props.metaByActiveAA.stakingVars;
  const stakingParams = props.metaByActiveAA.stakingParams;
  const leader =
    stakingVars[
      `leader_change_${props.name}${props.assetMeta.assetMetaData.asset}`
    ];

  if (leader) {
    return {
      finishDate: dayjs(
        (leader.flip_ts + getChallengingPeriod(stakingParams)) * 1000
      ).format("MMMM D, YYYY HH:mm"),
    };
  }

  return false;
});

function voteFromTable(value) {
  emit("reqVote", props.name, props.type, value);
}

onMounted(async () => {
  if (props.name === "price_aa") {
    const { asset, decimals, name } = props.assetMeta.assetMetaData;
    const targetPrice = await getTargetPriceByPriceAa(currentValue);
    const reservePrice = await getReservePriceFromPerpAA(props.perpAa);
    const r = await getPriceByAssets(
      props.perpAa,
      [asset],
      props.metaByActiveAA
    );
    const def = (await getDefinition(currentValue)).definition;
    const target = def[1].params.feed_name.split("_")[0];

    price.value = r[asset] * reservePrice * 10 ** decimals;
    selectedOracleData.value = {
      name,
      target,
      value: (targetPrice * 10 ** decimals).toPrecision(6),
    };
  }
});
</script>

<template>
  <div class="text-sm mt-4 w-full">
    <div class="font-bold text-lg flex items-center">
      {{ title }}
      <TooltipComponent class="inline-block ml-1" :field-name="name">
      </TooltipComponent>
    </div>
    <div class="mt-2">
      Current value:
      <a
        v-if="type === 'address'"
        class="link text-sky-500 link-hover block sm:inline-block text-xs sm:text-sm"
        target="_blank"
        rel="noopener"
        :href="fullExplorerUrlForAddress + currentValue"
        >{{ currentValue }}</a
      >
      <span v-else>{{ currentValue }}{{ suffix }}</span>
    </div>
    <div v-if="name === 'price_aa'">
      <div class="mt-1">
        Currency being tracked: {{ selectedOracleData.target }}
      </div>
      <div class="mt-1">Target price: ${{ selectedOracleData.value }}</div>
      <div class="mt-1">Actual price ${{ price.toPrecision(6) }}</div>
    </div>
    <div class="mt-2">
      <div v-if="votesByName?.length" class="mb-4">
        <div class="mt-4 mb-1 text-sm sm:text-base text-center font-bold">
          Votes for changing the value
        </div>
        <div class="overflow-auto">
          <VotingTable
            :type="type"
            :votes="votesByName"
            :decimals="reserveAssetMeta.decimals"
            :allowed-control="allowedControl"
            :user-voting-power="userVote.vp"
            @vote-from-table="voteFromTable"
          />
        </div>
        <div v-if="leaderDate" class="mt-2 text-left">
          If no new votes are received, the voting will end on
          {{ leaderDate.finishDate }} and the value will change to
          {{ calcVoteValue(votesByName[0].value, type)
          }}{{ type === "percent" ? "%" : "" }}
        </div>
        <div v-if="userVote?.vp" class="mt-2">
          You vote for
          <span class="font-normal sm:font-bold text-xs sm:text-sm"
            >{{ userVote.value }}{{ suffix }}</span
          >
          (VP: {{ userVote.vp }})
        </div>
      </div>
      <div
        class="text-center sm:text-left"
        v-if="allowedControl && name !== 'price_aa'"
      >
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
