<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import { generateLink } from "@/utils/generateLink";
import { useAaInfoStore } from "@/stores/aaInfo";

const router = useRouter();
const route = useRoute();

const store = useAaInfoStore();
const { aas, meta } = storeToRefs(store);

const selectedAA = ref("");
const link = ref("");
const metaByAA = ref(null);
const amount = ref({ value: "", error: "" });
const term = ref({ value: "360", error: "" });
const votedGroupKey = ref({ value: "g1", error: "" });
const percentages = ref({ value: "100", error: "" });

watch(
  () => {
    const aa = route.params.aa;
    const ml = Object.keys(meta.value).length;

    return `${aa}_${ml > 0}`;
  },
  () => {
    const aa = route.params.aa;
    if (aa && meta.value[aa]) {
      selectedAA.value = aa;
      metaByAA.value = meta.value[aa];
      return;
    }

    selectedAA.value = "";
    metaByAA.value = null;
  },
  { immediate: true }
);

watch(selectedAA, () => {
  router.push(`/stake/${selectedAA.value}`);
});

watch([amount, term, votedGroupKey, percentages], () => {
  if (!metaByAA.value) return;

  if (!amount.value.value) {
    amount.value.error = "Amount is required field!";
    return;
  }

  if (!term.value.value) {
    term.value.error = "Term is required field!";
    return;
  }

  if (!votedGroupKey.value.value) {
    votedGroupKey.value.error = "Voted group key is required field!";
    return;
  }

  if (!percentages.value.value) {
    percentages.value.error = "Percentages group key is required field!";
    return;
  }

  link.value = generateLink(
    amount.value,
    {
      deposit: 1,
      term: Number(term.value),
      voted_group_key: votedGroupKey.value,
      percentages: { a0: Number(percentages.value.value) },
    },
    null,
    metaByAA.value.staking_aa,
    metaByAA.value.state.asset0,
    true
  );
  console.log({
    deposit: 1,
    term: Number(term.value.value),
    voted_group_key: votedGroupKey.value.value,
    percentages: { a0: Number(percentages.value.value) },
  });
});

watch(
  () => amount.value.value,
  () => {
    amount.value.error = "";

    const amountValue = amount.value.value;

    if (!amountValue) {
      amountValue.value.error = "Amount is required field";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => term.value.value,
  () => {
    term.value.error = "";

    const termValue = term.value.value;

    if (!termValue) {
      term.value.error = "Term is required field";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => votedGroupKey.value.value,
  () => {
    votedGroupKey.value.error = "";

    const votedGroupKeyValue = votedGroupKey.value.value;

    if (!votedGroupKeyValue) {
      votedGroupKey.value.error = "Voted group key is required field";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => percentages.value.value,
  () => {
    percentages.value.error = "";

    const percentagesValue = percentages.value.value;

    if (!percentagesValue) {
      percentages.value.error = "Percentages is required field";
    }
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <div class="card flex w-full max-w-sm bg-base-100 justify-center">
    <div class="card-body">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Pool</span>
        </label>
        <select class="select select-bordered" v-model="selectedAA">
          <option value="" disabled>Please select aa</option>
          <option v-for="aa in aas" :key="aa" :value="aa">{{ aa }}</option>
        </select>
      </div>
      <div v-show="metaByAA">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Amount</span>
          </label>
          <input
            type="text"
            v-model="amount.value"
            class="input input-bordered"
          />
          <span
            v-if="amount.error"
            class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
          >
            {{ amount.error }}
          </span>
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Term</span>
          </label>
          <input
            type="text"
            v-model="term.value"
            class="input input-bordered"
          />
          <span
            v-if="term.error"
            class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
          >
            {{ term.error }}
          </span>
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Voted group key</span>
          </label>
          <input
            type="text"
            v-model="votedGroupKey.value"
            class="input input-bordered"
          />
          <span
            v-if="votedGroupKey.error"
            class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
          >
            {{ votedGroupKey.error }}
          </span>
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Percentages</span>
          </label>
          <input
            type="text"
            v-model="percentages.value"
            class="input input-bordered"
          />
          <span
            v-if="percentages.error"
            class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
          >
            {{ percentages.error }}
          </span>
        </div>
        <div class="form-control mt-6">
          <a class="btn btn-primary" :href="link">Stake</a>
        </div>
      </div>
    </div>
  </div>
</template>
