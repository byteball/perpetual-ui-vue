<script setup>
defineProps(["votes", "type", "suffix"]);
</script>

<template>
  <table class="table w-full">
    <thead>
      <tr>
        <th>Value</th>
        <th>Voting power</th>
        <th>Support</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="v in votes" :key="v.name">
        <td>
          {{ type === "date" ? v.name / 24 / 3600 : v.name * 100
          }}{{ suffix || "" }}
        </td>
        <td>{{ v.amount }}</td>
        <td><a class="link text-sky-500 link-hover">support this value</a></td>
      </tr>
    </tbody>
  </table>
</template>
