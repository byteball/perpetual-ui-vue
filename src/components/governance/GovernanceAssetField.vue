<script setup>
import TooltipComponent from "@/components/TooltipComponent.vue";

defineProps([
  "title",
  "value",
  "valueLink",
  "subValue",
  "subValueLink",
  "leader",
  "name",
]);
</script>

<template>
  <div class="mt-2">
    <span class="inline-flex items-center mr-1"
      >{{ title }}
      <TooltipComponent v-if="name" :field-name="name" class="ml-1" />:
    </span>
    <a
      v-if="valueLink"
      class="link text-sky-500 link-hover font-light text-sm"
      :href="valueLink"
      target="_blank"
      rel="noopener"
      >{{ value }}</a
    >
    <span v-else>{{ value }}</span>
    <span v-if="leader !== undefined && value > leader"> (new leader)</span>

    <template v-if="subValue">
      (<a
        class="link text-sky-500 link-hover font-light"
        target="_blank"
        rel="noopener"
        :href="subValueLink"
        >{{ subValue }}</a
      >)
    </template>
  </div>
</template>
