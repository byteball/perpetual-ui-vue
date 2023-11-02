<script setup>
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { fullExplorerUrlForAddress } from "@/config";
import { getVPFromNormalized } from "@/utils/getVP";
import { useAaInfoStore } from "@/stores/aaInfo";
import { useAddressStore } from "@/stores/addressStore";
import VotingTable from "@/components/governance/VotingTable.vue";
import { getOracleData } from "@/services/DAGApi";
import TooltipComponent from "@/components/TooltipComponent.vue";
import {
  getPriceByAssets,
  getReservePriceFromPerpAA,
} from "@/services/PerpAPI";

const props = defineProps([
  "perpAa",
  "title",
  "name",
  "type",
  "assetMeta",
  "votesByName",
  "allowedControl",
]);
const emit = defineEmits(["reqVote"]);
const currentValue = props.assetMeta[props.name] || 0;

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

onMounted(async () => {
  if (props.name === "price_aa") {
    const { asset, decimals } = props.assetMeta.assetMetaData;
    const oracleData = await getOracleData(currentValue);
    const reservePrice = await getReservePriceFromPerpAA(props.perpAa);
    const r = await getPriceByAssets(props.perpAa, [asset]);

    price.value = r[asset] * reservePrice * 10 ** decimals;
    selectedOracleData.value = oracleData;
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
        :href="fullExplorerUrlForAddress + currentValue"
        >{{ currentValue }}</a
      >
      <span v-else>{{ currentValue }}</span>
    </div>
    <div v-if="name === 'price_aa'">
      <div class="mt-1">
        Currency being tracked: {{ selectedOracleData.name }}
      </div>
      <div class="mt-1">Target price: {{ selectedOracleData.value }}</div>
      <div class="mt-1">Price ${{ price }}</div>
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
            :decimals="assetMeta.assetMetaData.decimals"
            :allowed-control="allowedControl"
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
      <div class="text-center sm:text-left" v-if="allowedControl">
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
