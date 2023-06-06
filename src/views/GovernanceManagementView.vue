<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { fullExplorerUrlForAddress } from "@/config";
import { useAaInfoStore } from "@/stores/aaInfo";
import {
  getAllVotes,
  getParam,
  getPreparedMeta,
} from "@/utils/governanceUtils";
import { generateAndFollowLinkForVoteAddPriceAA } from "@/utils/generateLink";
import Client from "@/services/Obyte";
import GovernanceAsset from "@/components/governance/GovernanceAsset.vue";
import PriceAANotFinished from "@/components/governance/PriceAANotFinished.vue";
import LinkIcon from "@/components/icons/LinkIcon.vue";
import VotingTable from "@/components/governance/VotingTable.vue";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from "@headlessui/vue";

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const route = useRoute();

const ready = ref(false);
const notFound = ref(false);
const perpetualAA = computed(() => route.params.aa);
const votes = ref({});

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
  console.log(preparedMeta.value);
  for (const priceAA in preparedMeta.value.priceAAsMeta) {
    const priceAADefinition = await Client.api.getDefinition(priceAA);
    priceAAsDefinition.value[priceAA] = priceAADefinition[1].params;
  }

  votes.value = getAllVotes(metaByAA.stakingVars);
  ready.value = true;
}

onMounted(init);
watch(meta, init, { deep: true });
</script>

<template>
  <div
    class="container w-[320px] sm:w-[768px] m-auto mt-40 mb-36 p-8"
    v-if="ready"
  >
    <div v-if="notFound" class="text-center">AA not found</div>
    <div v-else class="card bg-base-200 shadow-xl mb-4">
      <div class="card-body">
        <div>
          <div class="text-lg font-bold">
            <a
              class="link text-sky-500 link-hover"
              target="_blank"
              :href="fullExplorerUrlForAddress + perpetualAA"
              >{{ perpetualAA }}</a
            >
          </div>
          <GovernanceAsset :perpetual-aa-meta="preparedMeta" />
        </div>
        <div>
          <div class="flex justify-between mt-8 font-bold text-lg">
            <div>Swap fee</div>
            <div>
              Current value:
              {{ getParam("swap_fee", preparedMeta.rawMeta) * 100 }}%
            </div>
          </div>
          <div class="card bg-base-300 shadow-xl mt-2.5">
            <div class="card-body gap-0">
              <div class="text-center">
                <div v-if="votes['swap_fee'].length" class="mb-4">
                  <VotingTable
                    :votes="votes['swap_fee']"
                    type="percent"
                    suffix="%"
                  />
                </div>
                <a
                  class="link text-sky-500 link-hover"
                  @click="modalIsOpen = true"
                  >suggest another value</a
                >
              </div>
            </div>
          </div>
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
    <button
      class="btn btn-outline btn-circle btn-lg loading border-none"
    ></button>
  </div>
  <Dialog
    :open="modalIsOpen"
    @close="modalIsOpen = false"
    class="relative z-50"
  >
    <div class="fixed inset-0 bg-black/50" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center">
      <DialogPanel class="w-full max-w-lg rounded bg-base-200 p-8">
        <div class="text-center text-2xl font-bold">Change swap fee</div>
        <div class="mt-8 mb-8">
          <input class="input input-bordered w-full" placeholder="0.3" />
        </div>
        <div class="text-center">
          <button class="btn btn-primary">Vote for change</button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
