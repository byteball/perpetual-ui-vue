<script setup>
import GovernanceAssetField from "@/components/governance/GovernanceAssetField.vue";
import { getParam } from "@/utils/governanceUtils";
import SpoilerWithPerpMetaComponent from "@/components/SpoilerWithPerpMetaComponent.vue";

defineProps(["perpetualAaMeta"]);
</script>

<template>
  <div class="mt-4">
    <GovernanceAssetField
      title="Swap fee"
      name="swap_fee"
      :value="`${getParam('swap_fee', perpetualAaMeta.rawMeta) * 100}%`"
    />
    <SpoilerWithPerpMetaComponent :prepared-meta="perpetualAaMeta" />
  </div>
</template>
