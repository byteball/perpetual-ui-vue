<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import emitter from "@/services/emitter";

import Client from "@/services/Obyte";

const route = useRoute();

const exists = ref(false);

watch(exists, () => {
  console.log("ZBS");
});

emitter.on("aa_response", (data) => {
  console.log("aa_res", data);
  if (data.response.responseVars.address === route.params.aa) {
    exists.value = true;
  }
});

onMounted(() => {
  console.log("aa:", route.params.aa);
  Client.api.getDefinition(route.params.aa, function (err, result) {
    if (err) return console.error(err);
    exists.value = !!result;
  });
});
</script>

<template>
  <div v-if="!exists">Please await</div>
  <div v-if="exists">ZBS</div>
</template>
