<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import { useAddressStore } from "@/stores/addressStore";
import { getPreparedMeta } from "@/utils/governanceUtils";
import GovernanceAsset from "@/components/governance/GovernanceAsset.vue";
import { executeAAGetter } from "@/services/DAGApi";
import LoadingIcon from "@/components/icons/LoadingIcon.vue";

const store = useAaInfoStore();
const addressStore = useAddressStore();
const { aas, meta } = storeToRefs(store);
const { address } = storeToRefs(addressStore);

const aasWithMeta = ref({});
const aasVolumes = ref({});
const isLoaded = ref(false);

async function init() {
  if (!aas.value.length) return;

  const m = {};
  const promises = [];

  for (let aa in meta.value) {
    promises.push(getPreparedMeta(meta.value[aa], address.value));
  }
  const result = await Promise.all(promises);
  result.forEach((v) => {
    if (!v.asset0SymbolAndDecimals) return;
    m[v.rawMeta.aa] = v;
  });

  aasWithMeta.value = m;

  await getAAsVolumes();
  isLoaded.value = true;
}

const getAAsVolumes = async () => {
  const promises = [];
  Object.keys(aasWithMeta.value).map((aa) => {
    const reservePriceAA = aasWithMeta.value[aa].rawMeta.reserve_price_aa;

    promises.push(executeAAGetter(reservePriceAA, "get_reserve_price"));
  });

  const prices = await Promise.all(promises);
  Object.keys(aasWithMeta.value).map((aa, index) => {
    aasVolumes.value[aa] =
      aasWithMeta.value[aa].rawMeta.state.reserve * prices[index];
  });
};

const sortedAasWithMeta = computed(() => {
  if (!isLoaded.value) return [];
  return Object.entries(aasWithMeta.value).sort((a, b) => {
    const aPoolVolume = aasVolumes.value[a[0]];
    const bPoolVolume = aasVolumes.value[b[0]];

    return bPoolVolume - aPoolVolume;
  });
});

onMounted(init);
watch(meta, init, { deep: true });
</script>
<template>
  <div class="container w-full sm:w-[768px] m-auto mt-2 mb-36 p-6 sm:p-8">
    <div class="p-2 mb-6">
      <div class="text-lg font-semibold leading-7">Governance</div>
      <p class="mt-1 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </p>
    </div>
    <div v-if="!isLoaded" class="card bg-base-200 shadow-xl mb-4">
      <div class="card-body p-6 sm:p-8 items-center"><LoadingIcon /></div>
    </div>
    <div
      v-else-if="isLoaded && !sortedAasWithMeta.length"
      class="card bg-base-200 shadow-xl mb-4"
    >
      <div class="card-body p-6 sm:p-8 items-center">
        Governance AA has not yet been created
      </div>
    </div>
    <template v-else>
      <div v-for="aa in sortedAasWithMeta" :key="aa[0]">
        <div v-if="aa[1].asset0SymbolAndDecimals">
          <div
            class="card bg-base-200 shadow-xl mb-4"
            style="transform: translateZ(0)"
          >
            <div class="card-body p-6 sm:p-8">
              <div>
                <div class="block sm:flex justify-between items-center">
                  <div class="text-lg font-bold">
                    <RouterLink :to="`/governance/management/${aa[0]}`">
                      {{ aa[1].reserveAsset.name }}/{{
                        aa[1].asset0SymbolAndDecimals.name
                      }}
                    </RouterLink>
                  </div>
                  <div class="mt-3 mb-6 sm:my-0">
                    <RouterLink
                      class="btn btn-sm btn-primary"
                      :to="`/governance/management/${aa[0]}`"
                    >
                      Manage AA
                    </RouterLink>
                  </div>
                </div>
                <GovernanceAsset :perpetual-aa-meta="aa[1]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
