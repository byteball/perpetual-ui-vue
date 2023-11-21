<script setup>
import { fullExplorerUrlForAddress } from "@/config";
import { getParam } from "@/utils/governanceUtils";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";
import { ChevronRightIcon } from "@heroicons/vue/20/solid";
import GovernanceAssetField from "@/components/governance/GovernanceAssetField.vue";
import TooltipComponent from "@/components/TooltipComponent.vue";

defineProps(["preparedMeta"]);
</script>

<template>
  <Disclosure v-slot="{ open }">
    <DisclosureButton class="py-2 text-gray-500 flex items-center">
      <span>Show the set details</span>
      <ChevronRightIcon :class="open && 'rotate-90 transform'" class="w-5" />
    </DisclosureButton>
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-out"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <DisclosurePanel class="text-slate-300 pb-2 pl-2">
        <GovernanceAssetField
          title="Reserve asset"
          :value="preparedMeta.reserveAsset.name"
        />
        <GovernanceAssetField
          title="Governance asset"
          :value="preparedMeta.asset0SymbolAndDecimals.name"
        />
        <div class="mt-2">
          <span class="inline-flex items-center">
            Reserve price<TooltipComponent field-name="reserve_price" /> </span
          >:
          <a
            :href="fullExplorerUrlForAddress + preparedMeta.reservePriceAA"
            target="_blank"
            class="link text-sky-500 link-hover font-light text-sm"
            >{{ preparedMeta.reservePriceAA }}</a
          >&nbsp;<span class="inline-flex text-sm">
            (${{ preparedMeta.reservePriceValue.toPrecision(6) }}&nbsp;
            <TooltipComponent field-name="reserve_price_value" />)
          </span>
        </div>
        <GovernanceAssetField
          title="Staking AA"
          name="staking_aa"
          :value="preparedMeta.rawMeta.staking_aa"
          :value-link="
            fullExplorerUrlForAddress + preparedMeta.rawMeta.staking_aa
          "
        />
        <GovernanceAssetField
          title="Arb profit tax"
          name="arb_profit_tax"
          :value="`${getParam('arb_profit_tax', preparedMeta.rawMeta)}%`"
        />
        <GovernanceAssetField
          title="Adjustment period"
          name="adjustment_period"
          :value="`${
            getParam('adjustment_period', preparedMeta.rawMeta) / 24 / 3600
          } days`"
        />
        <GovernanceAssetField
          title="Presale period"
          name="presale_period"
          :value="`
          ${getParam('presale_period', preparedMeta.rawMeta) / 24 / 3600} days`"
        />
        <GovernanceAssetField
          title="Auction price halving period"
          name="auction_price_halving_period"
          :value="`
          ${
            getParam('auction_price_halving_period', preparedMeta.rawMeta) /
            24 /
            3600
          } days
        `"
        />
        <GovernanceAssetField
          title="Token share threshold"
          name="token_share_threshold"
          :value="`${
            getParam('token_share_threshold', preparedMeta.rawMeta) * 100
          }%`"
        />
        <GovernanceAssetField
          title="Min share of the governance asset"
          name="min_s0_share"
          :value="`${getParam('min_s0_share', preparedMeta.rawMeta) * 100}%`"
        />
      </DisclosurePanel>
    </transition>
  </Disclosure>
</template>

<style scoped></style>
