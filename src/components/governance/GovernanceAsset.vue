<script setup>
import GovernanceAssetField from "@/components/governance/GovernanceAssetField.vue";
import { ChevronRightIcon } from "@heroicons/vue/20/solid";
import { fullExplorerUrlForAddress } from "@/config";
import { getParam } from "@/utils/governanceUtils";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";
import TooltipComponent from "@/components/TooltipComponent.vue";

defineProps(["perpetualAaMeta"]);
</script>

<template>
  <div class="mt-4">
    <GovernanceAssetField
      title="Swap fee"
      name="swap_fee"
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
        <DisclosurePanel class="text-slate-300 pb-2 pl-2">
          <div class="mt-2">
            <span class="inline-flex items-center">
              Reserve price<TooltipComponent
                field-name="reserve_price"
              /> </span
            >:
            <a
              :href="fullExplorerUrlForAddress + perpetualAaMeta.reservePriceAA"
              target="_blank"
              class="link text-sky-500 link-hover font-light text-sm"
              >{{ perpetualAaMeta.reservePriceAA }}</a
            >&nbsp;<span class="inline-flex text-sm">
              (${{ perpetualAaMeta.reservePriceValue }}&nbsp;
              <TooltipComponent field-name="reserve_price_value" />)
            </span>
          </div>
          <GovernanceAssetField
            title="Staking aa"
            name="staking_aa"
            :value="perpetualAaMeta.rawMeta.staking_aa"
            :value-link="
              fullExplorerUrlForAddress + perpetualAaMeta.rawMeta.staking_aa
            "
          />
          <GovernanceAssetField
            title="Arb profit tax"
            name="arb_profit_tax"
            :value="`${getParam('arb_profit_tax', perpetualAaMeta.rawMeta)}%`"
          />
          <GovernanceAssetField
            title="Adjustment period"
            name="adjustment_period"
            :value="`${
              getParam('adjustment_period', perpetualAaMeta.rawMeta) / 24 / 3600
            } days`"
          />
          <GovernanceAssetField
            title="Presale period"
            name="presale_period"
            :value="`
          ${
            getParam('presale_period', perpetualAaMeta.rawMeta) / 24 / 3600
          } days`"
          />
          <GovernanceAssetField
            title="Auction price halving period"
            name="auction_price_halving_period"
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
            name="token_share_threshold"
            :value="`${
              getParam('token_share_threshold', perpetualAaMeta.rawMeta) * 100
            }%`"
          />
          <GovernanceAssetField
            title="Min s0 share"
            name="min_s0_share"
            :value="`${
              getParam('min_s0_share', perpetualAaMeta.rawMeta) * 100
            }%`"
          />
        </DisclosurePanel>
      </transition>
    </Disclosure>
  </div>
</template>
