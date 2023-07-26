<script setup>
import { onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Client from "@/services/Obyte";
import { generateDefinitionLink, generateLink } from "@/utils/generateLink";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import {getAssetMetadata, getDataFeed} from "@/services/DAGApi";
import debounce from "lodash.debounce";
import IntegerInput from "@/components/inputs/IntegerInput.vue";

let intervalId = 0;
const step = ref(1);

const route = useRoute();
const store = useAaInfoStore();
const { meta } = storeToRefs(store);
const router = useRouter();

const oracle = ref("F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N");
const feedName = ref("GBYTE_USD");
const multiplier = ref("1");
const tokens = ref("");

const priceAA = ref("");
const needCheckPriceAA = ref(false);

const linkForPriceAA = ref("");
const linkForPublishPerp = ref("");

const currentRate = ref(undefined);
const buttonDisabled = ref(true);

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

watch(
  [oracle, feedName],
  debounce(async () => {
    currentRate.value = await getDataFeed(oracle.value, feedName.value);
  }, 500),
  { immediate: true }
);

watch(
  [currentRate, multiplier],
  async () => {
    buttonDisabled.value = true;

    if (
      currentRate.value !== null &&
      currentRate.value !== undefined &&
      multiplier.value &&
      multiplier.value !== "0"
    ) {
      buttonDisabled.value = false;

      const reserveAsset = meta.value[route.params.aa].reserve_asset;
      const reserveAssetData = await getAssetMetadata(reserveAsset);

      tokens.value =
        10 ** reserveAssetData.decimals /
        (multiplier.value * currentRate.value);
    }
  },
  { immediate: true }
);

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

async function goBack() {
  await router.push(`/governance/management/${route.params.aa}`);
}

onUnmounted(() => {
  clearPriceInterval();
});
</script>
<template>
  <div class="container w-[320px] sm:w-[640px] m-auto mt-8 mb-36 p-8">
    <div @click="goBack()" class="p-2 mb-6 cursor-pointer">
      <div class="flex items-center">
        <div class="inline-block mr-2">
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
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </div>
        <div class="text-sm font-semibold leading-7 inline-block">Back</div>
      </div>
    </div>

    <div class="p-2 mb-6">
      <div class="text-lg font-semibold leading-7">Add new perpetual</div>
      <p class="mt-2 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </p>
    </div>

    <div v-if="step === 1">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <div class="!form-control">
            <div class="pt-2">
              <div class="flex items-center">
                <label class="label">
                  <span class="label-text">Oracle</span>
                </label>
                <div class="tooltip" data-tip="some information about field">
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
                </div>
              </div>
              <input
                type="text"
                v-model="oracle"
                class="input input-bordered w-full"
              />
            </div>
            <div class="pt-4">
              <div class="flex items-center">
                <label class="label">
                  <span class="label-text">Feed name</span>
                </label>
                <div class="tooltip" data-tip="some information about field">
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
                </div>
              </div>
              <input
                type="text"
                v-model="feedName"
                class="input input-bordered w-full"
              />
            </div>
            <div class="pt-4">
              <div class="flex items-center">
                <label class="label">
                  <span class="label-text">Multiplier</span>
                </label>
                <div class="tooltip" data-tip="some information about field">
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
                </div>
              </div>
              <IntegerInput
                v-model="multiplier"
                class="input input-bordered w-full"
              />

              <div v-if="currentRate !== undefined" class="mt-4 text-sm">
                <div v-if="currentRate && multiplier">
                  <div class="mt-2">
                    <span class="font-medium"> Tokens: </span>
                    {{ `${tokens}` }}
                  </div>
                </div>
                <div v-else class="tracking-wide text-red-500">
                  {{
                    "Data not found, please check oracle address and feed name"
                  }}
                </div>
              </div>
            </div>
          </div>
          <div class="mt-8 text-center !form-control">
            <a
              class="btn btn-primary"
              @click="checkExistsPriceAA"
              :class="{ '!btn-disabled': buttonDisabled }"
            >
              Add perpetual
            </a>
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
      <div class="alert">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="stroke-info shrink-0 w-6 h-6"
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
        <RouterLink
          class="btn btn-sm btn-primary"
          :to="`/governance/management/${route.params.aa}`"
        >
          Governance
        </RouterLink>
      </div>
    </div>
  </div>
</template>
