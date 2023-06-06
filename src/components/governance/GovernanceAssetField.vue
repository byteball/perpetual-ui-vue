<script setup>
defineProps(["title", "value", "valueLink", "subValue", "subValueLink"]);
</script>

<template>
  <div class="mt-2">
    <span class="font-medium">{{ title }}: </span>
    <a
      v-if="valueLink"
      class="link text-sky-500 link-hover font-light"
      :href="valueLink"
      target="_blank"
      >{{ value }}</a
    >
    <span v-else>{{ value }}</span>

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
