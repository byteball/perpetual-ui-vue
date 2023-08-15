<script setup>
import { onMounted, ref } from "vue";
import { getOracleData } from "@/services/DAGApi";
import { generateAndFollowLinkForVoteAddPriceAA } from "@/utils/generateLink";
import LinkIcon from "@/components/icons/LinkIcon.vue";

const props = defineProps([
  "priceAa",
  "stakingAa",
  "definition",
  "priceAasMeta",
  "allowedControl",
]);

const selectedOracleData = ref({});

onMounted(async () => {
  selectedOracleData.value = await getOracleData(props.priceAa);
});
</script>

<template>
  <div class="font-medium mb-4 overflow-hidden sm:overflow-auto text-ellipsis">
    {{ priceAa }}
  </div>
  <div class="block sm:flex justify-between">
    <div class="font-medium text-sm inline-block mb-1">
      Oracle:
      <div class="font-light text-xs sm:text-sm block sm:inline-block">
        {{ definition.oracle }}
      </div>
    </div>
    <div class="font-medium text-sm inline-block mb-1">
      Multiplier:
      <div class="font-light text-sm inline-block">
        {{ definition.multiplier || 1 }}
      </div>
    </div>
  </div>
  <div class="font-medium text-sm mb-1">
    Currency:
    <div class="font-light text-sm inline-block">
      {{ selectedOracleData.name }}
    </div>
  </div>
  <div class="font-medium text-sm mb-4">
    Current value:
    <div class="font-light text-sm inline-block">
      {{ selectedOracleData.value }}
    </div>
  </div>
  <div class="block sm:flex justify-between">
    <div class="text-sm font-medium block sm:inline-block">
      Status:
      <div class="text-sm font-light inline-block">
        <p
          v-if="
            priceAasMeta.vpAddPriceBCommit &&
            priceAasMeta.leaderAddPriceAA.value === 'yes'
          "
        >
          waiting commit
        </p>
        <p
          v-else-if="
            priceAasMeta.vpAddPriceBCommit &&
            priceAasMeta.leaderAddPriceAA.value === 'no'
          "
        >
          finished
        </p>
        <p v-else>not finished</p>
      </div>
    </div>
    <div class="font-medium text-sm block sm:inline-block">
      {{ priceAasMeta.vpAddPriceBCommit ? "Result: " : "Leader: " }}
      <div class="font-light text-sm inline-block">
        {{ priceAasMeta.leaderAddPriceAA.value }}
      </div>
    </div>
  </div>
  <div
    class="card-actions justify-start mt-4 text-center sm:text-left"
    v-if="allowedControl"
  >
    <div v-if="!priceAasMeta.vpAddPriceBCommit" class="w-full">
      <button
        class="btn btn-sm gap-2 mr-4"
        @click="
          generateAndFollowLinkForVoteAddPriceAA(priceAa, 'no', stakingAa)
        "
      >
        <LinkIcon />
        Vote for no
      </button>
      <button
        class="btn btn-sm gap-2 mt-4 sm:mt-0"
        @click="
          generateAndFollowLinkForVoteAddPriceAA(
            priceAa,
            priceAasMeta.leaderAddPriceAA.value,
            stakingAa
          )
        "
      >
        <LinkIcon />
        Vote for yes
      </button>
    </div>
    <div
      v-if="
        priceAasMeta.vpAddPriceBCommit &&
        priceAasMeta.leaderAddPriceAA.value === 'yes'
      "
      class="w-full"
    >
      <button
        class="btn btn-sm gap-2 mr-4"
        @click="
          generateAndFollowLinkForVoteAddPriceAA(priceAa, 'no', stakingAa)
        "
      >
        <LinkIcon />
        Vote for no
      </button>
      <button
        class="btn btn-sm gap-2 mt-4 sm:mt-0"
        @click="
          generateAndFollowLinkForVoteAddPriceAA(priceAa, 'yes', stakingAa)
        "
      >
        <LinkIcon />
        Commit result
      </button>
    </div>
    <div
      v-if="
        priceAasMeta.vpAddPriceBCommit &&
        priceAasMeta.leaderAddPriceAA.value === 'no'
      "
      class="w-full"
    >
      <button
        class="btn btn-sm gap-2 mt-4 sm:mt-0"
        @click="
          generateAndFollowLinkForVoteAddPriceAA(priceAa, 'yes', stakingAa)
        "
      >
        <LinkIcon />
        Vote for yes
      </button>
    </div>
  </div>
</template>
