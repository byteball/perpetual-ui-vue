<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getAllVotes, getPreparedMeta } from "@/utils/governanceUtils";
import {
  generateAndFollowLinkForVoteAddPriceAA,
  generateAndFollowLinkForVoteInGovernance,
} from "@/utils/generateLink";
import Client from "@/services/Obyte";
import GovernanceAsset from "@/components/governance/GovernanceAsset.vue";
import PriceAANotFinished from "@/components/governance/PriceAANotFinished.vue";
import LinkIcon from "@/components/icons/LinkIcon.vue";
import { Dialog } from "@headlessui/vue";
import VoteBlock from "@/components/governance/VoteBlock.vue";
import VoteModal from "@/components/governance/VoteModal.vue";

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const route = useRoute();

const ready = ref(false);
const notFound = ref(false);
const perpetualAA = computed(() => route.params.aa);
const votes = ref({});
const modalParams = ref({});

const preparedMeta = ref({});
const priceAAsDefinition = ref({});

const modalIsOpen = ref(false);

async function init() {
  if (!aas.value.length) return;

  const metaByAA = meta.value[perpetualAA.value];
  if (!metaByAA) {
    notFound.value = true;
    ready.value = true;
    return false;
  }
  notFound.value = false;

  preparedMeta.value = await getPreparedMeta(metaByAA);
  console.log(preparedMeta.value.priceAAsMeta);
  for (const priceAA in preparedMeta.value.priceAAsMeta) {
    const priceAADefinition = await Client.api.getDefinition(priceAA);
    priceAAsDefinition.value[priceAA] = priceAADefinition[1].params;
  }

  votes.value = getAllVotes(metaByAA.stakingVars);
  ready.value = true;
}

function reqVote(name, type, suffix, value) {
  let title;
  if (value) {
    title = `Vote for ${getTitleByName(name)} value`;
  } else {
    title = `Set new value for ${getTitleByName(name)}`;
  }
  showModal(title, name, type, suffix, value);
}

function showModal(title, name, type, suffix, value) {
  modalParams.value = {
    title,
    name,
    type,
    suffix,
    value,
  };
  modalIsOpen.value = true;
}

function vote(name, value) {
  generateAndFollowLinkForVoteInGovernance(
    name,
    value,
    preparedMeta.value.rawMeta.staking_aa
  );
}

function getTitleByName(name, toUpper) {
  let title;
  switch (name) {
    case "swap_fee":
      title = "swap fee";
      break;
    case "arb_profit_tax":
      title = "arb profit tax";
      break;
    case "adjustment_period":
      title = "adjustment period";
      break;
    case "presale_period":
      title = "presale period";
      break;
    case "auction_price_halving_period":
      title = "auction price halving period";
      break;
    case "token_share_threshold":
      title = "token share threshold";
      break;
    case "min_s0_share":
      title = "min s0 share";
      break;
    default:
      title = name;
  }

  if (toUpper) {
    title = title.charAt(0).toUpperCase() + title.substring(1);
  }

  return title;
}

onMounted(init);
watch(meta, init, { deep: true });
</script>

<template>
  <div
    class="container w-[320px] sm:w-[768px] m-auto mt-8 mb-36 p-8"
    v-if="ready"
  >
    <div @click="$router.go(-1)" class="p-2 mb-6 cursor-pointer">
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
          <GovernanceAsset :perpetual-aa-meta="preparedMeta" />
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
          <div
            v-for="(priceAAsMeta, priceAA) in preparedMeta.priceAAsMeta"
            :key="priceAA"
          >
            <div class="card bg-base-300 shadow-xl mb-8">
              <div class="card-body gap-0">
                <div v-if="!priceAAsMeta.finished">
                  <PriceAANotFinished
                    :price-aa="priceAA"
                    :staking-aa="preparedMeta.rawMeta.staking_aa"
                    :definition="priceAAsDefinition[priceAA]"
                    :price-aas-meta="priceAAsMeta"
                  />
                </div>
                <div
                  v-if="priceAAsMeta.finished"
                  class="card-actions justify-start"
                >
                  <div class="font-medium text-sm inline-block mb-2">
                    Status:
                    <div class="font-light text-sm inline-block">finished</div>
                  </div>
                  <button
                    v-if="priceAAsMeta.result === 'no'"
                    class="btn btn-sm gap-2 mt-4"
                    @click="
                      generateAndFollowLinkForVoteAddPriceAA(
                        priceAA,
                        'yes',
                        preparedMeta.rawMeta.staking_aa
                      )
                    "
                  >
                    <LinkIcon />
                    Vote for add
                  </button>
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
    :open="modalIsOpen"
    @close="modalIsOpen = false"
    class="relative z-50"
  >
    <div class="fixed inset-0 bg-black/50" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center">
      <VoteModal :params="modalParams" @vote="vote" />
    </div>
  </Dialog>
</template>
