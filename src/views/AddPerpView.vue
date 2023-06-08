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
  <div class="container w-[320px] sm:w-[640px] m-auto mt-8 mb-36 p-8">
    <div v-if="step === 1">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
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
          <div class="mt-8 text-center !form-control">
            <a class="btn btn-primary" @click="checkExistsPriceAA"
              >Add perpetual</a
            >
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="step === 2">
      <div class="alert shadow-lg">
        <div class="ml-2">
          <span>Good, now you need publish price AA</span>
        </div>
        <div class="flex-none">
          <a
            class="btn btn-sm btn-primary"
            :href="linkForPriceAA"
            @click="goToStep3()"
          >
            Publish price aa
          </a>
        </div>
      </div>
    </div>
    <div v-else-if="step === 3">
      <div v-if="needCheckPriceAA">
        <div class="alert shadow-lg">
          <svg
            class="animate-spin h-8 w-8 ml-2 mr-2"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <div>
            To continue, you need to wait until price aa is published, if you
            have not done so, click back
          </div>
          <div>
            <a class="btn btn-sm btn-primary" @click="back()">Back</a>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="step === 4">
      <div class="card bg-base-200 shadow-xl mt-2">
        <div class="card-body gap-0">
          <div class="text-sm font-medium inline-block mb-2">
            Perp AA:
            <div class="text-sm font-light inline-block">
              {{ route.params.aa }}
            </div>
          </div>
          <div class="text-sm font-medium inline-block mb-2">
            Oracle:
            <div class="text-sm font-light inline-block">
              {{ oracle }}
            </div>
          </div>
          <div class="text-sm font-medium inline-block mb-2">
            Feed name:
            <div class="text-sm font-light inline-block">
              {{ feedName }}
            </div>
          </div>
          <div class="text-sm font-medium inline-block mb-2">
            Multiplier:
            <div class="text-sm font-light inline-block">
              {{ multiplier }}
            </div>
          </div>
          <div class="card-actions justify-start mt-4">
            <a
              class="btn btn-sm gap-2 btn-primary"
              :href="linkForPublishPerp"
              @click="step = 5"
            >
              Publish perpetual
            </a>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="alert shadow-lg">
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="stroke-info h-6 w-6 ml-2 mr-2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              stroke="currentColor"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>Great, soon perpetual will be available for voting</span>
        </div>
      </div>
    </div>
  </div>
</template>
