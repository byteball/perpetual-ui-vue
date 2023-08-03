<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import { useAddressStore } from "@/stores/addressStore";
import { getPreparedMeta } from "@/utils/governanceUtils";
import GovernanceAsset from "@/components/governance/GovernanceAsset.vue";
import AddressController from "@/components/AddressController.vue";
import Loading from "@/components/icons/LoadingIcon.vue";

const store = useAaInfoStore();
const addressStore = useAddressStore();
const { aas, meta } = storeToRefs(store);
const { address } = storeToRefs(addressStore);

const aasWithMeta = ref({});

async function init() {
  if (!aas.value.length) return;

  const m = {};
  const promises = [];

  for (let aa in meta.value) {
    promises.push(getPreparedMeta(meta.value[aa], address.value));
  }
  const result = await Promise.all(promises);
  result.forEach((v) => {
    if (!v) return;
    m[v.rawMeta.aa] = v;
  });

  aasWithMeta.value = m;
}

onMounted(init);
watch(meta, init, { deep: true });
</script>
<template>
  <div
    v-if="Object.keys(aasWithMeta).length"
    class="container w-full sm:w-[768px] m-auto mt-8 mb-36 p-6 sm:p-8"
  >
    <AddressController />
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
          <div class="card-body p-6 sm:p-8">
            <div>
              <div class="block sm:flex justify-between items-center">
                <div class="text-lg font-bold">
                  {{ perpetualAAMeta.reserveAsset.name }}/{{
                    perpetualAAMeta.symbolAndDecimals.name
                  }}
                </div>
                <div class="mt-3 mb-6 sm:my-0">
                  <RouterLink
                    class="btn btn-sm"
                    :class="
                      perpetualAAMeta.allowedControl
                        ? 'btn-primary'
                        : 'btn-disabled'
                    "
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
              <div
                v-if="!perpetualAAMeta.allowedControl"
                class="mt-4 text-center"
              >
                To manage this aa you need to
                <RouterLink
                  class="link text-sky-500 link-hover font-light"
                  :to="`/stake/${perpetualAA}`"
                  >stake</RouterLink
                >
                {{ !address ? " and add your address" : "" }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="container w-full sm:w-[512px] m-auto mt-40 mb-36 p-6 sm:p-8 text-center"
  >
    <Loading />
  </div>
</template>
