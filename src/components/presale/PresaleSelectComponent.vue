<script setup>
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";
import { ref, watch } from "vue";

const props = defineProps([
  "modelValue",
  "selectedAa",
  "assetsMetadata",
  "selectedPresaleAsset",
  "presaleList",
  "selectedAsset0",
  "selectedReserveAsset",
]);
const emit = defineEmits(["update:modelValue"]);

const activePresaleIndex = ref(0);

watch(
  () => props.modelValue,
  () => {
    activePresaleIndex.value = props.modelValue;
  },
  { immediate: true }
);

watch(activePresaleIndex, () => {
  emit("update:modelValue", Number(activePresaleIndex.value));
});
</script>

<template>
  <div class="relative w-full">
    <Listbox v-model="activePresaleIndex">
      <ListboxButton v-slot="{ open }" :as="'template'">
        <div
          :class="{ '!border-blue-600': open, 'border-gray-600': !open }"
          class="select select-bordered w-full bg-base-200 border-gray-600 items-center"
        >
          {{
            selectedAa
              ? `${assetsMetadata[selectedPresaleAsset].name} in set \n ${assetsMetadata[selectedAsset0].name} / ${assetsMetadata[selectedReserveAsset].name}`
              : `Please select presale`
          }}
        </div>
      </ListboxButton>
      <ListboxOptions class="psc_options">
        <ListboxOption
          v-for="(presale, index) in presaleList"
          :key="`${presale.presaleAsset}_${presale.reserveAsset}_${presale.asset0}`"
          :value="index"
          as="template"
          v-slot="{ active, selected }"
        >
          <li
            :class="{
              psc_option_active: active,
              psc_option_not_active: !active,
              psc_option_selected: selected,
            }"
            class="py-3 px-4 cursor-pointer"
          >
            {{
              `${assetsMetadata[presale.presaleAsset].name} in set ${
                assetsMetadata[presale.asset0].name
              } / ${assetsMetadata[presale.reserveAsset].name}`
            }}
            <template v-if="presale.contributionAmount">
              (participating)</template
            >
          </li>
        </ListboxOption>
      </ListboxOptions>
    </Listbox>
  </div>
</template>

<style>
.psc_options {
  position: absolute;
  background-color: #2a303c;
  border: 1px solid #424955;
  width: 100%;
  margin-top: 4px;
  border-radius: 0.5rem;
}

.psc_option_active {
  background-color: #444c5e;
}

.psc_option_selected {
  background-color: #62748c !important;
}

.psc_option_not_active {
  background-color: #2a303c;
}
</style>
