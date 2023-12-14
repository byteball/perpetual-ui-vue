<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useAaInfoStore } from "@/stores/aaInfo";
import { useAddressStore } from "@/stores/addressStore";
import { getAllVotes, getPreparedMeta } from "@/utils/governanceUtils";
import { generateAndFollowLinkForVoteInGovernance } from "@/utils/generateLink";
import { getNotDefaultAssetsFromMeta } from "@/utils/assetsUtils";
import { getVPFromNormalized } from "@/utils/getVP";
import { getAssetMetadataByArray, getDefinition } from "@/services/DAGApi";
import PriceAANotFinished from "@/components/governance/PriceAANotFinished.vue";
import { Dialog } from "@headlessui/vue";
import VoteBlock from "@/components/governance/VoteBlock.vue";
import VoteModal from "@/components/governance/VoteModal.vue";
import PriceAAFinished from "@/components/governance/PriceAAFinished.vue";
import RegisterSymbolModal from "@/components/RegisterSymbolModal.vue";
import Loading from "@/components/icons/LoadingIcon.vue";
import { fullExplorerUrlForAddress } from "@/config";
import TooltipComponent from "@/components/TooltipComponent.vue";
import { getPriceByAssets, getReservePrice } from "@/services/PerpAPI";
import PieComponent from "@/components/PieComponent.vue";
import Asset0ForTradingComponent from "@/components/governance/Asset0ForTradingComponent.vue";

const store = useAaInfoStore();
const { setActiveAddress } = store;
const { aas, meta, timestamp } = storeToRefs(store);
const addressStore = useAddressStore();
const { address } = storeToRefs(addressStore);

const route = useRoute();
const router = useRouter();

const ready = ref(false);
const notFound = ref(false);
const perpetualAA = computed(() => route.params.aa);
const votes = ref({});
const modalParams = ref({});
const registerSymbolAsset = ref("");

const metaByActiveAA = ref({});
const preparedMeta = ref({});
const priceAAsDefinition = ref({});
const metaForFinishedAssets = ref({});
const dataForPie = ref({});

const modalForVoteIsOpen = ref(false);
const modalForRegisterSymbolIsOpen = ref(false);

const allowedControl = ref(false);

const activeTab = ref("trading");

const metaForFinishedAssetsForRendering = computed(() => {
  const result = {};
  for (let asset in metaForFinishedAssets.value) {
    const assetMeta = metaForFinishedAssets.value[asset];

    if (activeTab.value === "presale" && assetMeta.presale) {
      result[asset] = assetMeta;
    } else if (
      activeTab.value === "trading" &&
      (assetMeta.assetMetaData || assetMeta.preipo) &&
      !assetMeta.presale
    ) {
      result[asset] = assetMeta;
    }
  }

  return result;
});

const currentVP = computed(() => {
  if (!address.value) return 0;

  const metaByAA = meta.value[perpetualAA.value];
  const normalizedVp =
    metaByAA.stakingVars[`user_${address.value}_a0`]?.normalized_vp;
  const decimals = preparedMeta.value.asset0SymbolAndDecimals.decimals;

  return Number(
    (
      getVPFromNormalized(
        normalizedVp,
        metaByAA["decay_factor"],
        timestamp.value
      ) /
      10 ** decimals
    ).toFixed(decimals)
  );
});

const setTab = (tabName) => {
  if (
    !Object.keys(metaForFinishedAssets.value).length &&
    tabName === "presale"
  ) {
    return;
  }
  activeTab.value = tabName;
  router.replace({ hash: `#${tabName}` });
};

async function prepareDataForPie() {
  const pm = preparedMeta.value;
  const { asset: asset0, name: asset0Name } = pm.asset0SymbolAndDecimals;
  const reservePriceAa = pm.rawMeta.reserve_price_aa;
  const reservePrice = await getReservePrice(reservePriceAa);
  const assetList = [asset0];
  const symbolByAsset = {};
  const amountByAsset = {};
  symbolByAsset[asset0] = asset0Name;
  amountByAsset[asset0] = pm.rawMeta.state.s0;

  for (let asset in metaForFinishedAssets.value) {
    const { supply, assetMetaData, symbol } =
      metaForFinishedAssets.value[asset];
    if (!supply) continue;

    symbolByAsset[asset] = assetMetaData?.name || symbol || asset;
    amountByAsset[asset] = supply;
    assetList.push(asset);
  }

  const r = await getPriceByAssets(
    perpetualAA.value,
    assetList,
    metaByActiveAA.value
  );
  let asset0Price = 0;
  let ps = [];
  for (let asset in r) {
    const symbol = symbolByAsset[asset];
    const amount = amountByAsset[asset];
    const price = r[asset];

    let priceInUSD = amount * price * reservePrice;
    priceInUSD = +priceInUSD.toFixed(2);
    if (asset === asset0) {
      asset0Price = priceInUSD;
    } else {
      ps.push({ price: priceInUSD, symbol });
    }
  }
  ps.sort((a, b) => b.price - a.price);

  return [{ price: asset0Price, symbol: asset0Name }, ...ps];
}

async function init() {
  if (!aas.value.length) return;

  const metaByAA = meta.value[perpetualAA.value];
  if (!metaByAA) {
    notFound.value = true;
    ready.value = true;
    setActiveAddress("");
    return false;
  }
  setActiveAddress(perpetualAA.value);
  notFound.value = false;

  preparedMeta.value = await getPreparedMeta(metaByAA, address.value);
  allowedControl.value = preparedMeta.value.allowedControl;

  const defPromises = [];
  for (const priceAA of preparedMeta.value.priceAAsMeta.allPriceAAs) {
    defPromises.push(getDefinition(priceAA));
  }

  const result = await Promise.all(defPromises);
  result.forEach((v) => {
    priceAAsDefinition.value[v.aa] = v.definition[1].params;
  });

  votes.value = getAllVotes(
    metaByAA.stakingVars,
    timestamp.value,
    metaByAA["decay_factor"]
  );

  const assets = getNotDefaultAssetsFromMeta(metaByAA);
  const mForFinishedAssets = {};
  const metadataByAsset = await getAssetMetadataByArray(assets);

  for (let asset of assets) {
    const m = metaByAA[`asset_${asset}`];
    mForFinishedAssets[asset] = {
      metaByPriceAA: preparedMeta.value.priceAAsMeta.finished[m.price_aa],
      assetMetaData: metadataByAsset[asset],
      ...m,
    };
  }

  metaForFinishedAssets.value = mForFinishedAssets;

  if (route.hash) {
    setTab(route.hash.replace("#", ""));
  }

  if (!Object.keys(metaForFinishedAssets.value).length) {
    setTab("trading");
  }
  metaByActiveAA.value = meta.value[perpetualAA.value];
  dataForPie.value = await prepareDataForPie();
  ready.value = true;
}

function reqVote(name, type, suffix, value, priceAsset) {
  let title;
  if (value) {
    title = `Vote for ${getTitleByName(name)} value`;
  } else {
    title = `Set new value for ${getTitleByName(name)}`;
  }
  showModalForVote(title, name, type, suffix, value, priceAsset);
}

const userVote = (name, priceAsset) => {
  if (!address.value) return { vp: 0, value: 0 };

  const stakingVars = preparedMeta.value.rawMeta.stakingVars;
  const vote =
    stakingVars[
      `user_value_votes_${address.value}_${name}${priceAsset ? priceAsset : ""}`
    ];
  const df = meta.value[perpetualAA.value]["decay_factor"];

  if (vote) {
    return {
      vp: getVPFromNormalized(vote.vp, df, timestamp.value),
      value: vote.value,
    };
  } else {
    return { vp: 0, value: 0 };
  }
};

function showModalForVote(title, name, type, suffix, value, priceAsset) {
  const metaByAA = meta.value[perpetualAA.value];
  const df = metaByAA["decay_factor"];
  const userVP = getVPFromNormalized(
    metaByAA.stakingVars[`user_${address.value}_a0`]?.normalized_vp,
    df,
    timestamp.value
  );

  let votesByName = votes.value[name];
  if (priceAsset) {
    votesByName = votesByName[priceAsset];
  }

  modalParams.value = {
    title,
    name,
    type,
    suffix,
    value,
    votesByName,
    userVote: userVote(name, priceAsset),
    userVP,
    decimals: preparedMeta.value.asset0SymbolAndDecimals.decimals,
    priceAsset,
  };
  modalForVoteIsOpen.value = true;
}

function vote(name, value, priceAsset) {
  generateAndFollowLinkForVoteInGovernance(
    name,
    value,
    preparedMeta.value.rawMeta.staking_aa,
    priceAsset
  );
}

function reqRegister(asset) {
  registerSymbolAsset.value = asset;
  modalForRegisterSymbolIsOpen.value = true;
}

function getTitleByName(name, toUpper) {
  let title = name.replace(/_/g, " ");

  if (toUpper) {
    title = title.charAt(0).toUpperCase() + title.substring(1);
  }

  return title;
}

async function goBack() {
  await router.push(`/governance`);
}

onMounted(init);
onUnmounted(() => {
  setActiveAddress("");
});
watch(meta, init, { deep: true });
watch(
  () => address.value,
  async () => {
    const metaByAA = meta.value[perpetualAA.value];
    preparedMeta.value = await getPreparedMeta(metaByAA, address.value);
    allowedControl.value = preparedMeta.value.allowedControl;
  }
);
</script>
<style>
.tabs {
  flex-wrap: nowrap;
}
</style>
<template>
  <div
    class="container w-full sm:w-[768px] m-auto mt-2 p-6 sm:p-8"
    v-if="ready"
  >
    <div @click="goBack()" class="p-2 mb-6 cursor-pointer">
      <div class="flex items-center">
        <div class="inline-block mr-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </div>
        <div class="text-sm font-semibold leading-7 inline-block">Back</div>
      </div>
    </div>

    <div class="p-2 mb-6">
      <h1 class="text-lg font-bold leading-7 inline-block">
        Manage futures set
      </h1>
      <div class="mt-2 leading-6">
        Change this set's parameters, the parameters of its futures, and add new
        futures.
      </div>
    </div>
    <div v-if="notFound" class="text-center">AA not found</div>
    <div v-else class="card bg-base-200 shadow-xl mb-4">
      <div class="card-body p-6 sm:p-8">
        <div>
          <div class="text-lg font-bold">
            {{ preparedMeta.reserveAsset.name }}/{{
              preparedMeta.asset0SymbolAndDecimals.name
            }}
          </div>
          <div class="text-sm mt-1">
            Reserve asset: {{ preparedMeta.reserveAsset.name }}
          </div>
          <div class="text-sm mt-1">
            Governance asset: {{ preparedMeta.asset0SymbolAndDecimals.name }}
          </div>
          <div class="text-sm mt-1">
            Reserve price:
            <a
              :href="fullExplorerUrlForAddress + preparedMeta.reservePriceAA"
              target="_blank"
              class="link text-sky-500 link-hover"
              >{{ preparedMeta.reservePriceAA }}</a
            >&nbsp;
            <span class="inline-flex">
              (${{ preparedMeta.reservePriceValue.toPrecision(6) }}&nbsp;
              <TooltipComponent
                field-name="reserve_price_value"
              ></TooltipComponent
              >)
            </span>
          </div>
          <div class="text-sm mt-1">
            Reserve: {{ preparedMeta.reserve }}
            {{ preparedMeta.reserveAsset.name }} (${{
              +preparedMeta.reserveInUsd.toPrecision(6)
            }})
          </div>

          <div v-if="address" class="mt-2">
            <div>Your VP: {{ currentVP }}</div>
            <div>
              Your stake balance: {{ preparedMeta.stakeBalance }}
              {{ preparedMeta.asset0SymbolAndDecimals.name }}
            </div>
            <div>
              <RouterLink
                class="link text-sky-500 link-hover font-light"
                :to="`/stake/${perpetualAA}`"
                >Stake management</RouterLink
              >
            </div>
          </div>
          <div v-if="!currentVP" class="alert mt-6 bg-base-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="stroke-current shrink-0 w-6 h-6 text-primary"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span
              >To manage this set you need to
              <RouterLink
                class="link text-sky-500 link-hover font-light"
                :to="`/stake/${perpetualAA}`"
                >stake its governance asset</RouterLink
              >
              <template v-if="!address">
                and add
                <a
                  class="link text-sky-500 link-hover font-light"
                  @click="addressStore.openAddressModal"
                  >your address</a
                >
              </template>
            </span>
          </div>
          <div
            class="mt-4"
            v-if="preparedMeta.reserve && Object.keys(dataForPie).length"
          >
            <PieComponent :data="dataForPie" class="!h-[256px]" />
          </div>
        </div>
        <div>
          <VoteBlock
            title="Swap fee"
            name="swap_fee"
            :votes-by-name="votes['swap_fee']"
            :prepared-meta="preparedMeta"
            :allowed-control="allowedControl"
            type="percent"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Arb profit tax"
            name="arb_profit_tax"
            :votes-by-name="votes['arb_profit_tax']"
            :prepared-meta="preparedMeta"
            :allowed-control="allowedControl"
            type="percent"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Adjustment period"
            name="adjustment_period"
            :votes-by-name="votes['adjustment_period']"
            :prepared-meta="preparedMeta"
            :allowed-control="allowedControl"
            type="date"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Presale period"
            name="presale_period"
            :votes-by-name="votes['presale_period']"
            :prepared-meta="preparedMeta"
            :allowed-control="allowedControl"
            type="date"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Auction price halving period"
            name="auction_price_halving_period"
            :votes-by-name="votes['auction_price_halving_period']"
            :prepared-meta="preparedMeta"
            :allowed-control="allowedControl"
            type="date"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Token share threshold"
            name="token_share_threshold"
            :votes-by-name="votes['token_share_threshold']"
            :prepared-meta="preparedMeta"
            :allowed-control="allowedControl"
            type="percent"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Min governance asset share"
            name="min_s0_share"
            :votes-by-name="votes['min_s0_share']"
            :prepared-meta="preparedMeta"
            :allowed-control="allowedControl"
            type="percent"
            @reqVote="reqVote"
          />
        </div>

        <div :key="'p_' + address || 'address'">
          <div class="text-lg font-bold mt-8">Tokens issued in this set</div>
          <div class="tabs tabs-boxed mt-4 mb-2">
            <a
              class="tab"
              :class="{
                'tab-active': activeTab === 'trading',
              }"
              @click="setTab('trading')"
            >
              Trading
            </a>
            <a
              class="tab"
              :class="{
                'tab-active': activeTab === 'presale',
                'tab-disabled': !Object.keys(metaForFinishedAssets).length,
              }"
              @click="setTab('presale')"
            >
              <span class="inline sm:hidden">Presale</span>
              <span class="hidden sm:inline">On presale</span>
            </a>
            <a
              class="tab"
              :class="{ 'tab-active': activeTab === 'vote' }"
              @click="setTab('vote')"
            >
              Voting
            </a>
          </div>
          <div v-if="activeTab === 'trading' || activeTab === 'presale'">
            <div>
              <Asset0ForTradingComponent
                v-if="activeTab === 'trading'"
                :aa="perpetualAA"
                :asset0-metadata="preparedMeta.asset0SymbolAndDecimals"
                :price-aa="preparedMeta.rawMeta.reserve_price_aa"
                :reserve-price-value="preparedMeta.reservePriceValue"
                :meta-by-active-a-a="metaByActiveAA"
              />
              <div
                v-for="(assetMeta, asset) in metaForFinishedAssetsForRendering"
                :key="asset"
              >
                <PriceAAFinished
                  :perpetual-aa="perpetualAA"
                  :meta-by-active-a-a="metaByActiveAA"
                  :asset-meta="assetMeta"
                  :asset="asset"
                  :staking-aa="preparedMeta.rawMeta.staking_aa"
                  :price-aa="assetMeta.price_aa"
                  :price-aa-definition="priceAAsDefinition[assetMeta.price_aa]"
                  :votes="votes"
                  :allowed-control="allowedControl"
                  :active-tab="activeTab"
                  :reserve-asset-meta="preparedMeta.reserveAsset"
                  @reqRegister="reqRegister"
                  @reqVote="reqVote"
                />
              </div>
            </div>
            <div
              v-if="
                !Object.keys(metaForFinishedAssetsForRendering).length &&
                activeTab === 'presale'
              "
              class="card bg-base-300 shadow-xl mb-8"
            >
              <div class="card-body gap-0 p-3 sm:p-8 text-center">
                No assets on presale
              </div>
            </div>
          </div>
          <div v-if="activeTab === 'vote'">
            <div
              v-for="(priceAAsMeta, priceAA) in preparedMeta.priceAAsMeta
                .notFinished"
              :key="priceAA"
            >
              <div class="card bg-base-300 shadow-xl mb-8">
                <div class="card-body gap-0 p-3 sm:p-8">
                  <div>
                    <PriceAANotFinished
                      :price-aa="priceAA"
                      :staking-aa="preparedMeta.rawMeta.staking_aa"
                      :definition="priceAAsDefinition[priceAA]"
                      :price-aas-meta="priceAAsMeta"
                      :allowed-control="allowedControl"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              v-if="!Object.keys(preparedMeta.priceAAsMeta.notFinished).length"
              class="card bg-base-300 shadow-xl mb-8"
            >
              <div class="card-body gap-0 p-3 sm:p-8 text-center">
                No new assets offered for voting
              </div>
            </div>
          </div>
        </div>
        <div class="text-center mb-4">
          <RouterLink
            class="btn btn-sm btn-primary"
            :class="{ '!btn-disabled': !allowedControl }"
            :to="`/addPerp/${perpetualAA}`"
          >
            Add new perpetual for voting
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="container w-full sm:w-[512px] m-auto mt-40 p-6 sm:p-8 text-center"
  >
    <Loading />
  </div>
  <Dialog
    :open="modalForVoteIsOpen"
    @close="modalForVoteIsOpen = false"
    class="relative z-50"
  >
    <div class="fixed inset-0 bg-black/[.8]" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center">
      <VoteModal :params="modalParams" @vote="vote" />
    </div>
  </Dialog>
  <Dialog
    :open="modalForRegisterSymbolIsOpen"
    @close="modalForRegisterSymbolIsOpen = false"
    class="relative z-50"
  >
    <div class="fixed inset-0 bg-black/[.8]" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center">
      <RegisterSymbolModal
        :asset="registerSymbolAsset"
        :perp-aa="perpetualAA"
      />
    </div>
  </Dialog>
</template>
