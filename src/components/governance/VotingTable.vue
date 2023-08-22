<script setup>
import { rawToFormatVotingValue } from "@/utils/convertValue";
import { fullExplorerUrlForAddress } from "@/config";

defineProps([
  "votes",
  "type",
  "suffix",
  "decimals",
  "allowedControl",
  "userVotingPower",
]);
defineEmits(["voteFromTable"]);
</script>

<template>
  <table class="table w-full">
    <thead>
      <tr>
        <th>Value</th>
        <th>Voting power</th>
        <th v-if="allowedControl">Support</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(v, index) in votes" :key="v.value">
        <td>
          <a
            v-if="type === 'address'"
            class="link text-sky-500 link-hover block sm:inline-block text-xs sm:text-sm"
            target="_blank"
            :href="fullExplorerUrlForAddress + v.value"
          >
            {{ v.value }}
            {{ index === 0 ? "(leader)" : "" }}
          </a>
          <span v-else>
            {{ rawToFormatVotingValue(type, v.value) }}{{ suffix || "" }}
            {{ index === 0 ? "(leader)" : "" }}
          </span>
        </td>
        <td>
          {{ Number((v.amount / 10 ** decimals).toFixed(decimals)) }}

          {{
            Number(userVotingPower) &&
            Number((v.amount / 10 ** decimals).toFixed(decimals)) ===
              Number(userVotingPower)
              ? "(you)"
              : ""
          }}
        </td>
        <td v-if="allowedControl">
          <a
            class="link text-sky-500 link-hover"
            @click="$emit('voteFromTable', v.value)"
            >support this value</a
          >
        </td>
      </tr>
    </tbody>
  </table>
</template>
