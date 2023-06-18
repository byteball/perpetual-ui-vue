<script setup>
import { ref } from "vue";
import { getParam } from "@/utils/governanceUtils";
import VotingTable from "@/components/governance/VotingTable.vue";

const props = defineProps([
  "title",
  "name",
  "votesByName",
  "type",
  "preparedMeta",
]);

const emit = defineEmits(["reqVote"]);

const suffix = ref("");
const currentValue = ref(getParam(props.name, props.preparedMeta.rawMeta));

if (props.type === "date") {
  suffix.value = " days";
  currentValue.value = currentValue.value / 24 / 3600;
} else {
  suffix.value = "%";
  currentValue.value = currentValue.value * 100;
}

function voteFromTable(value) {
  emit("reqVote", props.name, props.type, suffix.value, value);
}
</script>

<template>
  <div class="mb-8">
    <div class="flex justify-between mt-8 font-bold text-lg">
      <div>{{ title }}</div>
      <div>
        Current value:
        {{ currentValue }}{{ suffix }}
      </div>
    </div>
    <div class="card bg-base-300 shadow-xl mt-2.5">
      <div class="card-body gap-0">
        <div class="text-center">
          <div v-if="votesByName?.length" class="mb-4">
            <VotingTable
              :votes="votesByName"
              :type="type"
              :suffix="suffix"
              :decimals="preparedMeta.symbolAndDecimals.decimals"
              @vote-from-table="voteFromTable"
            />
          </div>
          <div class="text-left">
            <a
              class="link text-sky-500 link-hover"
              @click="$emit('reqVote', name, type, suffix)"
              >suggest another value</a
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
