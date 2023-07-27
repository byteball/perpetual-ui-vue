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
import Client from "@/services/Obyte";
import PriceAANotFinished from "@/components/governance/PriceAANotFinished.vue";
import { Dialog } from "@headlessui/vue";
import VoteBlock from "@/components/governance/VoteBlock.vue";
import VoteModal from "@/components/governance/VoteModal.vue";
import { getAssetMetadata } from "@/services/DAGApi";
import PriceAAFinished from "@/components/governance/PriceAAFinished.vue";
import RegisterSymbolModal from "@/components/RegisterSymbolModal.vue";
import AddressController from "@/components/AddressController.vue";

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

const preparedMeta = ref({});
const priceAAsDefinition = ref({});
const metaForFinishedAssets = ref({});

const modalForVoteIsOpen = ref(false);
const modalForRegisterSymbolIsOpen = ref(false);

const currentVP = computed(() => {
  const metaByAA = meta.value[perpetualAA.value];
  const normalizedVp =
    metaByAA.stakingVars[`user_${address.value}_a0`]?.normalized_vp;
  const decimals = preparedMeta.value.symbolAndDecimals.decimals;

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
  if (!preparedMeta.value.allowedControl) {
    return router.push("/governance");
  }

  for (const priceAA of preparedMeta.value.priceAAsMeta.allPriceAAs) {
    const priceAADefinition = await Client.api.getDefinition(priceAA);
    priceAAsDefinition.value[priceAA] = priceAADefinition[1].params;
  }

  votes.value = getAllVotes(
    metaByAA.stakingVars,
    timestamp.value,
    metaByAA["decay_factor"]
  );

  const assets = getNotDefaultAssetsFromMeta(metaByAA);
  const mForFinishedAssets = {};
  for (let asset of assets) {
    const m = metaByAA[`asset_${asset}`];
    mForFinishedAssets[asset] = {
      metaByPriceAA: preparedMeta.value.priceAAsMeta.finished[m.price_aa],
      assetMetaData: await getAssetMetadata(asset),
      ...m,
    };
  }

  metaForFinishedAssets.value = mForFinishedAssets;

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
  console.log(title, name, type, suffix, value, votes.value);
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
    decimals: preparedMeta.value.symbolAndDecimals.decimals,
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
</script>

<template>
  <div
    v-if="!address"
    class="container w-[320px] sm:w-[512px] m-auto mt-8 mb-36 p-8"
  >
    <AddressController />
  </div>
  <div
    class="container w-[320px] sm:w-[768px] m-auto mt-8 mb-36 p-8"
    v-else-if="ready"
  >
    <AddressController />
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
      <div class="text-lg font-semibold leading-7 inline-block">
        Manage Autonomous Agent
      </div>
      <p class="mt-2 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </p>
    </div>
    <div v-if="notFound" class="text-center">AA not found</div>
    <div v-else class="card bg-base-200 shadow-xl mb-4">
      <div class="card-body">
        <div>
          <div class="text-lg font-bold">
            {{ preparedMeta.reserveAsset.name }}/{{
              preparedMeta.symbolAndDecimals.name
            }}
          </div>
          <div>Your VP: {{ currentVP }}</div>
        </div>
        <div>
          <VoteBlock
            title="Swap fee"
            name="swap_fee"
            :votes-by-name="votes['swap_fee']"
            :prepared-meta="preparedMeta"
            type="percent"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Arb profit tax"
            name="arb_profit_tax"
            :votes-by-name="votes['arb_profit_tax']"
            :prepared-meta="preparedMeta"
            type="percent"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Adjustment period"
            name="adjustment_period"
            :votes-by-name="votes['adjustment_period']"
            :prepared-meta="preparedMeta"
            type="date"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Presale period"
            name="presale_period"
            :votes-by-name="votes['presale_period']"
            :prepared-meta="preparedMeta"
            type="date"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Auction price halving period"
            name="auction_price_halving_period"
            :votes-by-name="votes['auction_price_halving_period']"
            :prepared-meta="preparedMeta"
            type="date"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Token share threshold"
            name="token_share_threshold"
            :votes-by-name="votes['token_share_threshold']"
            :prepared-meta="preparedMeta"
            type="percent"
            @reqVote="reqVote"
          />
          <VoteBlock
            title="Min s0 share"
            name="min_s0_share"
            :votes-by-name="votes['min_s0_share']"
            :prepared-meta="preparedMeta"
            type="percent"
            @reqVote="reqVote"
          />
        </div>

        <div>
          <div class="text-lg font-bold mt-8 mb-2.5">Price AAs</div>
          <div v-for="(assetMeta, asset) in metaForFinishedAssets" :key="asset">
            <PriceAAFinished
              :asset-meta="assetMeta"
              :asset="asset"
              :staking-aa="preparedMeta.rawMeta.staking_aa"
              :price-aa="assetMeta.price_aa"
              :price-aa-definition="priceAAsDefinition[assetMeta.price_aa]"
              :votes="votes"
              @reqRegister="reqRegister"
              @reqVote="reqVote"
            />
          </div>
          <div
            v-for="(priceAAsMeta, priceAA) in preparedMeta.priceAAsMeta
              .notFinished"
            :key="priceAA"
          >
            <div class="card bg-base-300 shadow-xl mb-8">
              <div class="card-body gap-0">
                <div>
                  <PriceAANotFinished
                    :price-aa="priceAA"
                    :staking-aa="preparedMeta.rawMeta.staking_aa"
                    :definition="priceAAsDefinition[priceAA]"
                    :price-aas-meta="priceAAsMeta"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center mb-4">
          <RouterLink
            class="btn btn-sm btn-primary"
            :to="`/addPerp/${perpetualAA}`"
          >
            Add perpetual for voting
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="container w-[320px] sm:w-[512px] m-auto mt-40 mb-36 p-8 text-center"
  >
    <span class="loading loading-spinner loading-md"></span>
  </div>
  <Dialog
    :open="modalForVoteIsOpen"
    @close="modalForVoteIsOpen = false"
    class="relative z-50"
  >
    <div class="fixed inset-0 bg-black/50" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center">
      <VoteModal :params="modalParams" @vote="vote" />
    </div>
  </Dialog>
  <Dialog
    :open="modalForRegisterSymbolIsOpen"
    @close="modalForRegisterSymbolIsOpen = false"
    class="relative z-50"
  >
    <div class="fixed inset-0 bg-black/50" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center">
      <RegisterSymbolModal
        :asset="registerSymbolAsset"
        :perp-aa="perpetualAA"
      />
    </div>
  </Dialog>
</template>
