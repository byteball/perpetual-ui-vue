<script setup>
import { onMounted, ref } from "vue";
import { getOracleData } from "@/services/DAGApi";
import { generateAndFollowLinkForVoteAddPriceAA } from "@/utils/generateLink";
import LinkIcon from "@/components/icons/LinkIcon.vue";
import VoteBlockForPriceAA from "@/components/governance/VoteBlockForPriceAA.vue";

const props = defineProps([
  "perpetualAa",
  "assetMeta",
  "asset",
  "priceAa",
  "stakingAa",
  "priceAaDefinition",
  "votes",
  "allowedControl",
]);
const emit = defineEmits(["reqRegister", "reqVote"]);

const selectedOracleData = ref({});

function reqRegister() {
  console.log("props", props.asset);
  emit("reqRegister", props.asset);
}

function reqVote(name, type, value) {
  emit("reqVote", "change_" + name, type, "", value, props.asset);
}

onMounted(async () => {
  if (props.assetMeta.presale) {
    selectedOracleData.value = await getOracleData(props.priceAa);
  }
});
</script>

<template>
  <div class="card bg-base-300 shadow-xl mb-8">
    <div class="card-body gap-0 p-3 sm:p-8">
      <div v-if="assetMeta.assetMetaData?.name">
        <div class="font-medium mb-4">
          {{ assetMeta.assetMetaData.name }}
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
          Currency:
          <div class="font-light text-sm inline-block">
            {{ selectedOracleData.name }}
          </div>
        </div>
        <div class="font-medium text-sm mb-4">
          Target value:
          <div class="font-light text-sm inline-block">
            {{ selectedOracleData.value }}
          </div>
        </div>
      </div>

      <div class="font-medium text-sm mb-2">
        Status:
        <span v-if="assetMeta.assetMetaData" class="font-light text-sm">
          {{ assetMeta.presale ? "presale" : "trading" }}
        </span>
        <span v-else class="font-light text-sm">
          voting is completed, but need register symbol
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
        <div v-if="allowedControl">
          <button
            v-if="assetMeta.metaByPriceAA.result === 'no'"
            class="btn btn-sm gap-2 mt-4"
            @click="
              generateAndFollowLinkForVoteAddPriceAA(priceAa, 'yes', stakingAa)
            "
          >
            <LinkIcon />
            Vote for add
          </button>
          <RouterLink
            v-if="
              assetMeta.assetMetaData?.name &&
              assetMeta.metaByPriceAA.result === 'yes' &&
              assetMeta.presale
            "
            class="btn btn-sm gap-2 mt-4"
            :to="`/presale/${asset}`"
          >
            <LinkIcon />
            Buy on presale
          </RouterLink>
        </div>

        <div v-if="!assetMeta.presale" class="w-full">
          <div class="divider"></div>
          <VoteBlockForPriceAA
            title="Price aa"
            type="address"
            name="price_aa"
            :asset-meta="assetMeta"
            :votes-by-name="votes['change_price_aa'][asset]"
            :allowed-control="allowedControl"
            @reqVote="reqVote"
          />
          <div class="divider mt-8"></div>
          <VoteBlockForPriceAA
            class="mt-8"
            title="Drift rate"
            type="number"
            name="drift_rate"
            :asset-meta="assetMeta"
            :votes-by-name="votes['change_drift_rate'][asset]"
            :allowed-control="allowedControl"
            @reqVote="reqVote"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
