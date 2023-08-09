<script setup>
import { rawToFormatVotingValue } from "@/utils/convertValue";

defineProps(["votes", "type", "suffix", "decimals", "allowedControl"]);
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
          {{ rawToFormatVotingValue(type, v.value) }}{{ suffix || "" }}
          {{ index === 0 ? "(leader)" : "" }}
        </td>
        <td>{{ Number((v.amount / 10 ** decimals).toFixed(decimals)) }}</td>
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
