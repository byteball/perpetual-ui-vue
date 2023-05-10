<script setup>
import { onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Client from "@/services/Obyte";
import { generateDefinitionLink, generateLink } from "@/utils/generateLink";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";

let intervalId = 0;
const step = ref(1);

const route = useRoute();
const store = useAaInfoStore();
const { meta } = storeToRefs(store);

const oracle = ref("F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N");
const feedName = ref("GBYTE_USD");
const multiplier = ref("1");

const priceAA = ref("");
const needCheckPriceAA = ref(false);

const linkForPriceAA = ref("");
const linkForPublishPerp = ref("");

function setLinkForPriceAA() {
  linkForPriceAA.value = generateDefinitionLink([
    "autonomous agent",
    {
      base_aa: "33QMBZUN3ZB3ETXLJAX4PULREZTSW55Q",
      params: {
        oracle: oracle.value,
        feed_name: feedName.value,
        multiplier: multiplier.value,
      },
    },
  ]);
}

async function checkExistsPriceAA() {
  const result = await Client.api.executeGetter({
    address: "TWV4APP6EM6AFEJNHWTATHAIBQVU4IAS",
    getter: "getAAAddressByDefinition",
    args: [
      [
        "autonomous agent",
        {
          base_aa: "33QMBZUN3ZB3ETXLJAX4PULREZTSW55Q",
          params: {
            oracle: oracle.value,
            feed_name: feedName.value,
            multiplier: multiplier.value,
          },
        },
      ],
    ],
  });

  priceAA.value = result.result;
  const def = await Client.api.getDefinition(result.result);
  if (def) {
    step.value = 4;
  } else {
    step.value = 2;
    setLinkForPriceAA();
  }
}

function clearPriceInterval() {
  if (intervalId) {
    clearInterval(intervalId);
  }
}

async function checkPriceAA() {
  console.log("check checkPriceAA");
  const def = await Client.api.getDefinition(priceAA.value);
  if (def) {
    console.log("check checkPriceAA def");
    clearPriceInterval();
    needCheckPriceAA.value = false;
    step.value = 4;
  }
  console.log("check price done");
}
function setTimerForCheckPriceAA() {
  intervalId = setInterval(checkPriceAA, 5000);
  checkPriceAA();
}

function goToStep3() {
  needCheckPriceAA.value = true;
  step.value = 3;
}

function back() {
  needCheckPriceAA.value = false;
  step.value = 2;
}

watch(step, () => {
  if (step.value === 3 && needCheckPriceAA.value) {
    setTimerForCheckPriceAA();
  }
  if (step.value === 4) {
    linkForPublishPerp.value = generateLink(
      10000,
      {
        vote_value: 1,
        name: "add_price_aa",
        price_aa: priceAA.value,
        value: "yes",
      },
      null,
      meta.value[route.params.aa].staking_aa,
      "base",
      true
    );
  }
});

onUnmounted(() => {
  clearPriceInterval();
});
</script>
<template>
  <div class="container w-[320px] sm:w-[512px] m-auto mt-40 mb-36 p-8">
    <div v-if="step === 1">
      <div class="!form-control">
        <div class="pt-2">
          <label class="label">
            <span class="label-text">Oracle</span>
          </label>
          <input
            type="text"
            v-model="oracle"
            class="input input-bordered w-full"
          />
        </div>
        <div class="pt-4">
          <label class="label">
            <span class="label-text">Feed name</span>
          </label>
          <input
            type="text"
            v-model="feedName"
            class="input input-bordered w-full"
          />
        </div>
        <div class="pt-4">
          <label class="label">
            <span class="label-text">Multiplier</span>
          </label>
          <input
            type="text"
            v-model="multiplier"
            class="input input-bordered w-full"
          />
        </div>
      </div>
      <div class="mt-8 text-center">
        <a class="btn btn-primary" @click="checkExistsPriceAA">Add perp</a>
      </div>
    </div>
    <div v-else-if="step === 2">
      <div class="text-center">Good, now you need publish price aa</div>
      <div class="mt-8 text-center">
        <a class="btn btn-primary" :href="linkForPriceAA" @click="goToStep3()"
          >Publish price aa</a
        >
      </div>
    </div>
    <div v-else-if="step === 3">
      <div v-if="needCheckPriceAA">
        <div>
          To continue, you need to wait until price aa is published, if you have
          not done so, click back
        </div>
        <div class="mt-8 text-center">
          <a class="btn btn-primary" @click="back()">Back</a>
        </div>
      </div>
    </div>
    <div v-else-if="step === 4">
      <div>
        <div>Perp AA: {{ route.params.aa }}</div>
        <div class="mt-2">
          <div class="mt-1">Oracle: {{ oracle }}</div>
          <div class="mt-1">Feed name: {{ feedName }}</div>
          <div class="mt-1">Multiplier: {{ multiplier }}</div>
        </div>
        <div class="mt-8 text-center">
          <a
            class="btn btn-primary"
            :href="linkForPublishPerp"
            @click="step = 5"
            >Publish perpetual</a
          >
        </div>
      </div>
    </div>
    <div v-else>
      <div class="text-center">
        Great, soon perp will be available for voting
      </div>
    </div>
  </div>
</template>
