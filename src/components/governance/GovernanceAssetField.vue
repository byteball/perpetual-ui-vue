<script setup>
defineProps([
  "title",
  "value",
  "valueLink",
  "subValue",
  "subValueLink",
  "leader",
]);
</script>

<template>
  <div class="mt-2">
    <span>{{ title }}: </span>
    <a
      v-if="valueLink"
      class="link text-sky-500 link-hover font-light text-sm"
      :href="valueLink"
      target="_blank"
      >{{ value }}</a
    >
    <span v-else>{{ value }}</span>
    <span v-if="leader !== undefined && value > leader"> (new leader)</span>

    <template v-if="subValue">
      (<a
        class="link text-sky-500 link-hover font-light"
        target="_blank"
        :href="subValueLink"
        >{{ subValue }}</a
      >)
    </template>
  </div>
</template>
