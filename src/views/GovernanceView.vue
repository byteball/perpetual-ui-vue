<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import Client from "@/services/Obyte";
import { getPreparedMeta } from "@/utils/governanceUtils";
import GovernanceAsset from "@/components/governance/GovernanceAsset.vue";

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const aasWithMeta = ref({});
const priceAAsDefinition = ref({});

async function init() {
  if (!aas.value.length) return;

  const m = {};
  for (let aa in meta.value) {
    m[aa] = await getPreparedMeta(meta.value[aa]);

    for (const priceAA in m[aa].priceAAsMeta) {
      const priceAADefinition = await Client.api.getDefinition(priceAA);
      priceAAsDefinition.value[priceAA] = priceAADefinition[1].params;
    }
  }

  aasWithMeta.value = m;
}

onMounted(init);
watch(meta, init, { deep: true });
</script>
<template>
  <div
    v-if="Object.keys(aasWithMeta).length"
    class="container w-[320px] sm:w-[768px] m-auto mt-40 mb-36 p-8"
  >
    <div class="mb-8">
      <div class="text-lg font-semibold leading-7">Governance</div>
      <p class="mt-1 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </p>
    </div>

    <div
      v-for="(perpetualAAMeta, perpetualAA) in aasWithMeta"
      :key="perpetualAA"
    >
      <div v-if="perpetualAAMeta.symbolAndDecimals">
        <div class="card bg-base-200 shadow-xl mb-4">
          <div class="card-body">
            <div>
              <div class="text-lg font-bold">
                {{ perpetualAAMeta.reserveAsset.name }}/{{
                  perpetualAAMeta.symbolAndDecimals.name
                }}
              </div>
              <GovernanceAsset
                :perpetual-aa-meta="perpetualAAMeta"
                :is-main-page="true"
              />
              <div class="text-center mt-8">
                <RouterLink
                  class="btn btn-sm btn-primary"
                  :to="`/governance/management/${perpetualAA}`"
                >
                  Manage AA
                </RouterLink>
              </div>
            </div>
          </div>
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
</template>
