<script setup>
import { onMounted, ref } from "vue";
import { propertyTips } from "@/texts";
import { Tooltip } from "floating-vue";

const props = defineProps(["fieldName", "replace"]);

const dataTip = ref("");

onMounted(() => {
  let text = propertyTips[props.fieldName] || "";
  if (!text) {
    console.error("data tip error, field name: " + props.fieldName);
  }

  if (props.replace && Object.keys(props.replace).length) {
    const replace = props.replace;
    Object.keys(replace).forEach((key) => {
      text = text.replace(`{${key}}`, replace[key]);
    });
  }

  dataTip.value = text;
});
</script>

<template>
  <Tooltip>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-5 h-5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>

    <template #popper>
      <div style="max-width: 24rem" class="m-2 text-slate-200">
        {{ dataTip }}
      </div>
    </template>
  </Tooltip>
</template>

<style>
.v-popper--theme-tooltip .v-popper__inner {
  background-color: rgb(23, 23, 23) !important;
  opacity: 1;
}
</style>
