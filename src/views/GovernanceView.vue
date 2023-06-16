<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getPreparedMeta } from "@/utils/governanceUtils";
import GovernanceAsset from "@/components/governance/GovernanceAsset.vue";

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const aasWithMeta = ref({});

async function init() {
  if (!aas.value.length) return;

  const m = {};
  for (let aa in meta.value) {
    m[aa] = await getPreparedMeta(meta.value[aa]);
  }

  aasWithMeta.value = m;
}

onMounted(init);
watch(meta, init, { deep: true });
</script>
<template>
  <div
    v-if="Object.keys(aasWithMeta).length"
    class="container w-[320px] sm:w-[768px] m-auto mt-8 mb-36 p-8"
  >
    <div class="p-2 mb-6">
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
              <div class="flex justify-between items-center">
                <div class="text-lg font-bold">
                  {{ perpetualAAMeta.reserveAsset.name }}/{{
                    perpetualAAMeta.symbolAndDecimals.name
                  }}
                </div>
                <div>
                  <RouterLink
                    class="btn btn-sm btn-primary"
                    :to="`/governance/management/${perpetualAA}`"
                  >
                    Manage AA
                  </RouterLink>
                </div>
              </div>
              <GovernanceAsset
                :perpetual-aa-meta="perpetualAAMeta"
                :is-main-page="true"
              />
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
    <span class="loading loading-spinner loading-md"></span>
  </div>
</template>
