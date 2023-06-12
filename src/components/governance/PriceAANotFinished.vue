<script setup>
import { generateAndFollowLinkForVoteAddPriceAA } from "@/utils/generateLink";
import LinkIcon from "@/components/icons/LinkIcon.vue";

defineProps(["priceAa", "stakingAa", "definition", "priceAasMeta"]);
</script>

<template>
  <div class="text-sm font-medium inline-block mb-2">
    Price AA:
    <div class="text-sm font-light inline-block">
      {{ priceAa }}
    </div>
  </div>
  <div class="flex justify-between">
    <div class="font-medium text-sm inline-block mb-2">
      Oracle:
      <div class="font-light text-sm inline-block">
        {{ definition.oracle }}
      </div>
    </div>
    <div class="font-medium text-sm inline-block mb-2">
      Multiplier:
      <div class="font-light text-sm inline-block">
        {{ definition.multiplier || 1 }}
      </div>
    </div>
  </div>
  <div class="font-medium text-sm inline-block mb-2">
    Feed name:
    <div class="font-light text-sm inline-block">
      {{ definition.feed_name }}
    </div>
  </div>
  <div class="flex justify-between">
    <div class="text-sm font-medium inline-block">
      Status:
      <div class="text-sm font-light inline-block">
        <p v-if="priceAasMeta.vpAddPriceBCommit">waiting commit</p>
        <p v-else>not finished</p>
      </div>
    </div>
    <div class="font-medium text-sm inline-block">
      {{ priceAasMeta.vpAddPriceBCommit ? "Result: " : "Leader: " }}
      <div class="font-light text-sm inline-block">
        {{ priceAasMeta.leaderAddPriceAA.value }}
      </div>
    </div>
  </div>
  <div class="card-actions justify-start mt-4">
    <div v-if="!priceAasMeta.vpAddPriceBCommit">
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
        class="btn btn-sm gap-2"
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
    <div v-if="priceAasMeta.vpAddPriceBCommit">
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
        class="btn btn-sm gap-2"
        @click="
          generateAndFollowLinkForVoteAddPriceAA(priceAa, 'yes', stakingAa)
        "
      >
        <LinkIcon />
        Commit result
      </button>
    </div>
  </div>
</template>
