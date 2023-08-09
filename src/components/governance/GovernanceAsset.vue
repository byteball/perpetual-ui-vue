<script setup>
import GovernanceAssetField from "@/components/governance/GovernanceAssetField.vue";
import { ChevronRightIcon } from "@heroicons/vue/20/solid";
import { fullExplorerUrlForAddress } from "@/config";
import { getParam } from "@/utils/governanceUtils";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";

defineProps(["perpetualAaMeta"]);
</script>

<template>
  <div class="mt-4">
    <GovernanceAssetField
      title="Swap fee"
      :value="`${getParam('swap_fee', perpetualAaMeta.rawMeta) * 100}%`"
    />

    <Disclosure v-slot="{ open }">
      <DisclosureButton class="py-2 text-gray-500 flex items-center">
        <span>Show all details</span>
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
        <DisclosurePanel class="text-slate-300 pb-2">
          <GovernanceAssetField
            title="Staking aa"
            :value="perpetualAaMeta.rawMeta.staking_aa"
            :value-link="
              fullExplorerUrlForAddress + perpetualAaMeta.rawMeta.staking_aa
            "
          />
          <GovernanceAssetField
            title="Arb profit tax"
            :value="`${getParam('arb_profit_tax', perpetualAaMeta.rawMeta)}%`"
          />
          <GovernanceAssetField
            title="Adjustment period"
            :value="`${
              getParam('adjustment_period', perpetualAaMeta.rawMeta) / 24 / 3600
            } days`"
          />
          <GovernanceAssetField
            title="Presale period"
            :value="`
          ${
            getParam('presale_period', perpetualAaMeta.rawMeta) / 24 / 3600
          } days`"
          />
          <GovernanceAssetField
            title="Auction price halving period"
            :value="`
          ${
            getParam('auction_price_halving_period', perpetualAaMeta.rawMeta) /
            24 /
            3600
          } days
        `"
          />
          <GovernanceAssetField
            title="Token share threshold"
            :value="`${
              getParam('token_share_threshold', perpetualAaMeta.rawMeta) * 100
            }%`"
          />
          <GovernanceAssetField
            title="Min s0 share"
            :value="`${
              getParam('min_s0_share', perpetualAaMeta.rawMeta) * 100
            }%`"
          />
        </DisclosurePanel>
      </transition>
    </Disclosure>
  </div>
</template>
