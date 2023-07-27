<script setup>
import { generateAndFollowLinkForVoteAddPriceAA } from "@/utils/generateLink";
import LinkIcon from "@/components/icons/LinkIcon.vue";
import VoteBlockForPriceAA from "@/components/governance/VoteBlockForPriceAA.vue";

const props = defineProps([
  "assetMeta",
  "asset",
  "priceAa",
  "stakingAa",
  "priceAaDefinition",
  "votes",
]);
const emit = defineEmits(["reqRegister", "reqVote"]);

function reqRegister() {
  emit("reqRegister", props.asset);
}

function reqVote(name, type, value) {
  emit("reqVote", "change_" + name, type, "", value, props.asset);
}
</script>

<template>
  <div class="card bg-base-300 shadow-xl mb-8">
    <div class="card-body gap-0">
      <div v-if="assetMeta.assetMetaData?.name">
        <div class="font-medium mb-2">
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
        <div class="font-medium text-sm mb-2">
          Asset:
          <span class="font-light text-sm">
            {{ asset }}
          </span>
        </div>
        <div class="flex justify-between">
          <div class="font-medium text-sm inline-block mb-2">
            Oracle:
            <div class="font-light text-sm inline-block">
              {{ priceAaDefinition.oracle }}
            </div>
          </div>
          <div class="font-medium text-sm inline-block mb-2">
            Multiplier:
            <div class="font-light text-sm inline-block">
              {{ priceAaDefinition.multiplier || 1 }}
            </div>
          </div>
        </div>
        <div class="font-medium text-sm inline-block mb-2">
          Feed name:
          <div class="font-light text-sm inline-block">
            {{ priceAaDefinition.feed_name }}
          </div>
        </div>
      </div>
      <div class="font-medium text-sm mb-2">
        Status:
        <span v-if="assetMeta.assetMetaData" class="font-light text-sm">
          {{ assetMeta.presale ? "presale" : "asset added" }}
        </span>
        <span v-else class="font-light text-sm">
          voting is completed, but need register symbol
        </span>
      </div>
      <div class="card-actions justify-start">
        <button
          v-if="!assetMeta.assetMetaData"
          class="btn btn-sm gap-2 mt-4"
          @click="reqRegister"
        >
          <LinkIcon />
          Register a symbol
        </button>
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

        <div v-if="!assetMeta.presale" class="mt-8">
          <VoteBlockForPriceAA
            title="Price aa"
            type="address"
            name="price_aa"
            :asset-meta="assetMeta"
            :votes-by-name="votes['change_price_aa'][asset]"
            @reqVote="reqVote"
          />
          <VoteBlockForPriceAA
            class="mt-8"
            title="Drift rate"
            type="number"
            name="drift_rate"
            :asset-meta="assetMeta"
            :votes-by-name="votes['change_drift_rate'][asset]"
            @reqVote="reqVote"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
