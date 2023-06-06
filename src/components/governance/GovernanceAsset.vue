<script setup>
import GovernanceAssetField from "@/components/governance/GovernanceAssetField.vue";
import { getUrlForReserveAsset } from "@/utils/assetsUtils";
import {
  fullExplorerUrlForAddress,
  fullExplorerUrlForUnit,
  tokenUrl,
} from "@/config";
import { getParam } from "@/utils/governanceUtils";

const props = defineProps(["perpetualAaMeta", "isMainPage"]);
console.log(props.perpetualAaMeta);
</script>

<template>
  <div class="text-sm mt-4">
    <GovernanceAssetField
      title="Reserve asset"
      :value="
        perpetualAaMeta.reserveAsset.asset === 'base'
          ? 'GBYTE'
          : perpetualAaMeta.reserveAsset.asset
      "
      :value-link="getUrlForReserveAsset(perpetualAaMeta.reserveAsset.asset)"
      :sub-value="perpetualAaMeta.symbolAndDecimals.name"
      :sub-value-link="tokenUrl + perpetualAaMeta.symbolAndDecimals.name"
    />
    <GovernanceAssetField
      title="Asset0"
      :value="perpetualAaMeta.symbolAndDecimals.asset"
      :value-link="
        fullExplorerUrlForUnit + perpetualAaMeta.symbolAndDecimals.asset
      "
      :sub-value="perpetualAaMeta.symbolAndDecimals.name"
      :sub-value-link="tokenUrl + perpetualAaMeta.symbolAndDecimals.name"
    />
    <GovernanceAssetField
      title="Staking aa"
      :value="perpetualAaMeta.rawMeta.staking_aa"
      :value-link="
        fullExplorerUrlForAddress + perpetualAaMeta.rawMeta.staking_aa
      "
    />
    <template v-if="isMainPage">
      <GovernanceAssetField
        title="Swap fee"
        :value="`${getParam('swap_fee', perpetualAaMeta.rawMeta) * 100}%`"
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
        :value="`${getParam('min_s0_share', perpetualAaMeta.rawMeta) * 100}%`"
      />
    </template>
  </div>
</template>
