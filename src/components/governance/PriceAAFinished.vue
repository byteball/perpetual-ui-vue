<script setup>
import { onBeforeMount, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { getOracleData } from "@/services/DAGApi";
import {
  followLink,
  generateAndFollowLinkForVoteAddPriceAA,
  generateLink,
} from "@/utils/generateLink";
import LinkIcon from "@/components/icons/LinkIcon.vue";
import VoteBlockForPriceAA from "@/components/governance/VoteBlockForPriceAA.vue";
import { fullExplorerUrlForAddress, fullExplorerUrlForAsset } from "@/config";
import { getParam } from "@/utils/governanceUtils";
import { useAaInfoStore } from "@/stores/aaInfo";
import dayjs from "dayjs";
import { useAddressStore } from "@/stores/addressStore";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const props = defineProps([
  "perpetualAa",
  "assetMeta",
  "asset",
  "priceAa",
  "stakingAa",
  "priceAaDefinition",
  "votes",
  "allowedControl",
  "activeTab",
  "metaByActiveAA",
  "reserveAssetMeta",
]);
const emit = defineEmits(["reqRegister", "reqVote"]);

const store = useAaInfoStore();
const addressStore = useAddressStore();
const { meta } = storeToRefs(store);
const { address } = storeToRefs(addressStore);

const selectedOracleData = ref({});
const presaleData = ref({});

function reqRegister() {
  emit("reqRegister", props.asset, props.priceAaDefinition.multiplier || 1);
}

function reqVote(name, type, value) {
  emit(
    "reqVote",
    "change_" + name,
    type,
    type === "percent" ? "%" : "",
    value,
    props.asset
  );
}

function setPresaleData() {
  const aa = props.perpetualAa;
  const presalePeriod = getParam("presale_period", meta.value[aa]);
  const tokenShareThreshold = getParam("token_share_threshold", meta.value[aa]);
  const reserve = meta.value[aa].state.reserve;

  const presaleAssetIssue = meta.value[aa][`asset_${props.asset}`].creation_ts;
  const currentPresaleAmount =
    meta.value[aa][`asset_${props.asset}`].presale_amount;

  const finishDateRaw = dayjs((presaleAssetIssue + presalePeriod) * 1000);
  const finishDate = finishDateRaw.format("MMMM D, YYYY HH:mm");
  const targetPresaleAmount = tokenShareThreshold * reserve;

  let contributionAmount = 0;
  if (address.value) {
    contributionAmount =
      meta.value[aa][`contribution_${address.value}_${props.asset}`] || 0;
  }

  if (contributionAmount) {
    contributionAmount =
      contributionAmount / 10 ** props.reserveAssetMeta.decimals;
  }

  const isPresaleFinished =
    targetPresaleAmount < currentPresaleAmount ||
    finishDateRaw.diff(dayjs()) < 0;

  presaleData.value = {
    isPresaleFinished,
    finishDate,
    currentAmount: currentPresaleAmount / 10 ** props.reserveAssetMeta.decimals,
    targetAmount: targetPresaleAmount / 10 ** props.reserveAssetMeta.decimals,
    symbol: props.reserveAssetMeta.name,
    contributionAmount,
  };
}

const openClaimLink = (presaleAsset, aa) => {
  const data = {
    asset: presaleAsset,
    claim: 1,
  };

  followLink(generateLink(10000, data, null, aa, "base", true));
};

onBeforeMount(() => {
  if (props.assetMeta.presale) {
    setPresaleData();
  }
});

onMounted(async () => {
  if (!props.priceAa) return;
  selectedOracleData.value = await getOracleData(props.priceAa);
});
</script>

<template>
  <div
    v-if="activeTab === 'trading' && assetMeta.preipo && !assetMeta.presale"
    class="card bg-base-300 shadow-xl mb-8"
  >
    <div class="card-body gap-0 p-3 sm:p-8">
      <div class="font-medium mb-4">{{ assetMeta.symbol }} (pre-ipo asset)</div>
      <div class="font-medium text-sm mb-2">
        Asset:
        <span class="font-light text-sm">
          <a
            target="_blank"
            rel="noopener"
            :href="fullExplorerUrlForAsset + asset"
            class="link link-hover text-sky-500"
            >{{ asset }}</a
          ></span
        >
      </div>
      <div class="font-medium text-sm mb-2">
        Max tokens:
        <span class="font-light text-sm"> {{ assetMeta.max_tokens }} </span>
      </div>
      <div class="font-medium text-sm mb-2">
        Initial price:
        <span class="font-light text-sm">
          {{ assetMeta.initial_price.toPrecision(6) }}
        </span>
      </div>
      <div class="font-medium text-sm mb-2">
        Last auction price:
        <span class="font-light text-sm">
          {{ assetMeta.last_auction_price.toPrecision(6) }}
        </span>
      </div>
    </div>
  </div>
  <div
    v-else-if="activeTab === 'presale' && assetMeta.presale && priceAa"
    class="card bg-base-300 shadow-xl mb-8"
  >
    <div class="card-body gap-0 p-3 sm:p-8">
      <div v-if="assetMeta.assetMetaData?.name">
        <div class="font-medium mb-4">
          {{ assetMeta.assetMetaData.name }} tracking
          {{ selectedOracleData.name }}
        </div>
        <div class="font-medium text-sm mb-2">
          Decimals:
          <span class="font-light text-sm">
            {{ assetMeta.assetMetaData.decimals }}
          </span>
        </div>
      </div>
      <div v-else>
        <div
          class="font-medium mb-4 overflow-hidden sm:overflow-auto text-ellipsis"
        >
          {{ asset }}
        </div>

        <div class="block sm:flex justify-between">
          <div class="font-medium text-sm sm:inline-block mb-1">
            Oracle:
            <div class="font-light text-xs sm:text-sm inline-block">
              {{ priceAaDefinition.oracle }}
            </div>
          </div>
          <div class="font-medium text-sm sm:inline-block mb-1">
            Multiplier:
            <div class="font-light text-sm inline-block">
              {{ priceAaDefinition.multiplier || 1 }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="assetMeta.presale">
        <div class="font-medium text-sm mb-1">
          Price AA:
          <div class="font-light text-sm inline-block">
            <a
              :href="fullExplorerUrlForAddress + priceAa"
              target="_blank"
              rel="noopener"
              class="link text-sky-500 link-hover"
              >{{ priceAa }}</a
            >
          </div>
        </div>
        <div class="font-medium text-sm mb-1">
          Currency being tracked:
          <div class="font-light text-sm inline-block">
            {{ selectedOracleData.name }}
          </div>
        </div>
        <div class="font-medium text-sm mb-4">
          Target price:
          <div class="font-light text-sm inline-block">
            {{ selectedOracleData.value }}
          </div>
        </div>
        <div
          class="font-medium text-sm mb-1"
          v-if="!presaleData.isPresaleFinished"
        >
          Presale ends on:
          <div class="font-light text-sm inline-block">
            {{ presaleData.finishDate }}
          </div>
        </div>
        <div class="font-medium text-sm mb-1">
          Sold:
          <div class="font-light text-sm inline-block">
            {{ +presaleData.currentAmount.toPrecision(6) }} /
            {{ +presaleData.targetAmount.toPrecision(6) }}
            {{ presaleData.symbol }}
          </div>
        </div>
        <div
          v-if="presaleData.contributionAmount"
          class="font-medium text-sm mb-1"
        >
          Your contribution:
          <div class="font-light text-sm inline-block">
            {{ presaleData.contributionAmount }}
            {{ presaleData.symbol }}
          </div>
        </div>
      </div>

      <div class="font-medium text-sm mb-2 mt-4">
        Status:
        <span v-if="assetMeta.assetMetaData" class="font-light text-sm">
          <template v-if="!presaleData.isPresaleFinished">
            {{ "presale" }}
          </template>
          <template v-else>
            {{
              presaleData.contributionAmount
                ? "finished, available for claim"
                : "finished, available for purchase"
            }}
          </template>
        </span>
        <span v-else class="font-light text-sm">
          voting is completed, but need to register a symbol
        </span>
      </div>
      <div
        class="card-actions sm:justify-start block sm:flex text-center sm:text-left"
      >
        <button
          v-if="!assetMeta.assetMetaData"
          class="btn btn-sm gap-2 mt-4"
          @click="reqRegister"
        >
          <LinkIcon />
          Register a symbol
        </button>
        <button
          v-if="allowedControl && assetMeta.metaByPriceAA.result === 'no'"
          class="btn btn-sm gap-2 mt-4"
          @click="
            generateAndFollowLinkForVoteAddPriceAA(priceAa, 'yes', stakingAa)
          "
        >
          <LinkIcon />
          Vote for add
        </button>
        <template
          v-if="
            assetMeta.assetMetaData?.name &&
            assetMeta.metaByPriceAA.result === 'yes' &&
            assetMeta.presale
          "
        >
          <RouterLink
            class="btn btn-sm gap-2 mt-4"
            :to="`/presale/${asset}`"
            v-if="!presaleData.isPresaleFinished"
          >
            <LinkIcon />
            Buy on presale
          </RouterLink>
          <a
            v-else-if="
              presaleData.isPresaleFinished && presaleData.contributionAmount
            "
            class="btn btn-sm gap-2 mt-4"
            @click="openClaimLink(asset, perpetualAa)"
          >
            <LinkIcon />
            Claim
          </a>
          <RouterLink class="btn btn-sm gap-2 mt-4" :to="'/'" v-else>
            <LinkIcon />
            Open market
          </RouterLink>
        </template>
      </div>
    </div>
  </div>

  <div
    v-if="
      activeTab === 'trading' && assetMeta.assetMetaData && !assetMeta.presale
    "
    class="card bg-base-300 shadow-xl mb-8"
  >
    <div class="card-body gap-0 p-3 sm:p-8">
      <div v-if="assetMeta.assetMetaData?.name">
        <div class="font-medium mb-4">
          {{ assetMeta.assetMetaData.name }} tracking
          {{ selectedOracleData.name }}
        </div>
        <div class="font-medium text-sm mb-2">
          Decimals:
          <span class="font-light text-sm">
            {{ assetMeta.assetMetaData.decimals }}
          </span>
        </div>
      </div>
      <div v-else>
        <div
          class="font-medium mb-4 overflow-hidden sm:overflow-auto text-ellipsis"
        >
          {{ asset }}
        </div>
        <div class="block sm:flex justify-between">
          <div class="font-medium text-sm sm:inline-block mb-1">
            Oracle:
            <div class="font-light text-xs sm:text-sm inline-block">
              {{ priceAaDefinition.oracle }}
            </div>
          </div>
          <div class="font-medium text-sm sm:inline-block mb-1">
            Multiplier:
            <div class="font-light text-sm inline-block">
              {{ priceAaDefinition.multiplier || 1 }}
            </div>
          </div>
        </div>
      </div>
      <div class="font-medium text-sm mb-2">
        Status:
        <span
          v-if="assetMeta.assetMetaData && !assetMeta.presale"
          class="font-light text-sm"
        >
          {{ "trading" }}
        </span>
      </div>
      <div
        class="card-actions sm:justify-start block sm:flex text-center sm:text-left"
      >
        <div v-if="!assetMeta.presale" class="w-full">
          <div class="divider"></div>
          <VoteBlockForPriceAA
            title="Price AA"
            type="address"
            name="price_aa"
            :perp-aa="perpetualAa"
            :asset-meta="assetMeta"
            :reserve-asset-meta="reserveAssetMeta"
            :votes-by-name="votes['change_price_aa'][asset]"
            :allowed-control="allowedControl"
            :meta-by-active-a-a="metaByActiveAA"
            @reqVote="reqVote"
          />
          <div class="divider mt-8"></div>
          <VoteBlockForPriceAA
            class="mt-8"
            title="Drift rate"
            type="percent"
            name="drift_rate"
            :asset-meta="assetMeta"
            :reserve-asset-meta="reserveAssetMeta"
            :votes-by-name="votes['change_drift_rate'][asset]"
            :allowed-control="allowedControl"
            :meta-by-active-a-a="metaByActiveAA"
            @reqVote="reqVote"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
