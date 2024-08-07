<script setup>
import { ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { event } from "vue-gtag";
import { generateDefinitionLink, generateLink } from "@/utils/generateLink";
import { parseDataFromRequest } from "@/utils/parseDataFromRequest";
import { useAaInfoStore } from "@/stores/aaInfo";
import {
  executeAAGetter,
  getAAsByBaseAAs,
  getAssetMetadata,
} from "@/services/DAGApi";
import emitter from "@/services/emitter";
import TooltipComponent from "@/components/TooltipComponent.vue";
import NumberInput from "@/components/inputs/NumberInput.vue";
import OracleComponent from "@/components/OracleComponent.vue";
import { ADDRESSES } from "@/config";
import { getDefinition } from "@/services/DAGApi";

let intervalId = 0;
const step = ref(1);

const route = useRoute();
const store = useAaInfoStore();
const { meta } = storeToRefs(store);
const router = useRouter();

const stakingAA = ref("");

const oracleResult = ref({});
const errorMessage = ref("");
const multiplier = ref("1");

const reserveAssetData = ref({});

const priceAA = ref("");
const needCheckPriceAA = ref(false);

const linkForPriceAA = ref("");
const linkForPublishPerp = ref("");

const currentRate = ref(undefined);
const buttonDisabled = ref(true);

function setLinkForPriceAA() {
  const { oracleAddress, dataFeed } = oracleResult.value;
  linkForPriceAA.value = generateDefinitionLink([
    "autonomous agent",
    {
      base_aa: import.meta.env.VITE_BASE_PRICE_AA,
      params: {
        oracle: oracleAddress,
        feed_name: dataFeed,
        multiplier: multiplier.value,
      },
    },
  ]);
}

async function checkExistsPriceAA() {
  const { oracleAddress, dataFeed } = oracleResult.value;

  const address = "TWV4APP6EM6AFEJNHWTATHAIBQVU4IAS";
  const getter = "getAAAddressByDefinition";
  const args = [
    [
      "autonomous agent",
      {
        base_aa: import.meta.env.VITE_BASE_PRICE_AA,
        params: {
          oracle: oracleAddress,
          feed_name: dataFeed,
          multiplier: multiplier.value,
        },
      },
    ],
  ];

  const result = await executeAAGetter(address, getter, args);

  priceAA.value = result;
  const defResult = await getDefinition(result);

  if (defResult.definition) {
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
  const result = await getAAsByBaseAAs(import.meta.env.VITE_BASE_PRICE_AA);

  const addressExists = !!result.find((v) => {
    return v.address === priceAA.value;
  });

  if (addressExists) {
    console.log("check checkPriceAA exists");
    clearPriceInterval();
    needCheckPriceAA.value = false;
    step.value = 4;
  }
  console.log("check price done");
}
function setTimerForCheckPriceAA() {
  intervalId = setInterval(checkPriceAA, 10000);
  checkPriceAA();
}

function goToStep3() {
  needCheckPriceAA.value = true;
  step.value = 3;
  createPriceAAEvent();
}

function back(toStep) {
  needCheckPriceAA.value = false;
  step.value = toStep;
}

function setEmptyData() {
  oracleResult.value = {};
  errorMessage.value = "";
}

function setError(error) {
  setEmptyData();
  errorMessage.value = error;
}
function oracleDataUpdated(result) {
  setEmptyData();
  if (result.error) {
    return setError(result.error);
  }

  if (result.oracleAddress) {
    oracleResult.value = result;
    if (result.symbolMetadata?.decimals) {
      const d = result.symbolMetadata.decimals;
      multiplier.value = (1 / 10 ** d).toFixed(d);
      return;
    }
    multiplier.value = "1";
  }
}

function createPriceAAEvent() {
  const { oracleAddress, dataFeed } = oracleResult.value;
  event("create_price_aa", {
    event_label: `${oracleAddress} - ${dataFeed} - ${multiplier.value}`,
  });
}

function addPriceAA() {
  event("add_price_aa", {
    event_label: priceAA.value,
  });
}

watch(
  [() => oracleResult.value.value, multiplier, meta],
  async () => {
    buttonDisabled.value = true;
    const currentRate = oracleResult.value.value;
    if (
      meta.value[route.params.aa]?.reserve_asset &&
      currentRate !== null &&
      currentRate !== undefined &&
      multiplier.value &&
      multiplier.value !== "0"
    ) {
      buttonDisabled.value = false;

      const reserveAsset = meta.value[route.params.aa].reserve_asset;
      reserveAssetData.value = await getAssetMetadata(reserveAsset);
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
      stakingAA.value,
      "base",
      true
    );
  }
});

async function goBack() {
  if (step.value === 2) {
    return back(1);
  }
  if (step.value === 3 || step.value === 4) {
    return back(2);
  }
  await router.push(`/governance/management/${route.params.aa}`);
}

function handlerForStakeRequests(data) {
  const _d = parseDataFromRequest(data);
  if (_d.name === "add_price_aa" && _d.price_aa === priceAA.value) {
    step.value = 5;
  }
}

watch(
  [meta],
  () => {
    if (!meta.value[route.params.aa]) {
      return;
    }

    stakingAA.value = meta.value[route.params.aa].staking_aa;
    emitter.on(`aa_request_${stakingAA.value}`, handlerForStakeRequests);
  },
  { immediate: true }
);

onBeforeRouteLeave(() => {
  clearPriceInterval();
  emitter.off(`aa_request_${stakingAA.value}`, handlerForStakeRequests);
});
</script>
<template>
  <div class="container w-full sm:w-[640px] m-auto mt-2 p-6 sm:p-8">
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
      <h1 class="text-2xl font-bold leading-8">Add new perpetual future</h1>
      <div class="mt-2 leading-6">
        Create a governance proposal to add a new perpetual future asset
        tracking some currency, stock, or commodity. The proposal will be then
        be voted by the governance token holders (you can participate), and if
        approved, the new asset will first become available for presale, then
        regular trading will open.
      </div>
    </div>

    <div v-if="step === 1">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body p-6 sm:p-8">
          <div class="!form-control">
            <OracleComponent
              :big-margin="true"
              @data-updated="oracleDataUpdated"
            />
            <div class="pt-4">
              <div class="flex items-center">
                <label class="label">
                  <span class="label-text">Multiplier</span>
                </label>
                <TooltipComponent field-name="multiplier"> </TooltipComponent>
              </div>
              <NumberInput v-model="multiplier" :decimals="12" />

              <div v-if="oracleResult.value !== undefined" class="mt-4">
                <div v-if="oracleResult.value && multiplier">
                  <div class="mt-2">
                    Current value:
                    <span
                      v-if="
                        oracleResult.oracleAddress === ADDRESSES.default_oracle
                      "
                      >${{ +oracleResult.value.toFixed(2) }}</span
                    >
                    <span v-else>{{ currentRate }}</span>
                  </div>
                </div>
              </div>
              <div v-if="errorMessage" class="tracking-wide text-red-500">
                {{ errorMessage }}
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
          <span
            >Good, now you need to create the price AA for the new asset</span
          >
        </div>
        <div></div>
        <div>
          <a
            class="btn btn-sm btn-primary"
            :href="linkForPriceAA"
            @click="goToStep3()"
          >
            Create price AA
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
            To continue, you need to wait until the price AA is confirmed
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="step === 4">
      <div class="card bg-base-200 shadow-xl mt-2">
        <div class="card-body gap-0 p-6 sm:p-8">
          <div class="text-sm font-medium inline-block mb-2">
            Perp AA:
            <div class="text-sm font-light inline-block">
              {{ route.params.aa }}
            </div>
          </div>
          <div class="text-sm font-medium inline-block mb-2">
            Oracle:
            <div class="text-sm font-light inline-block">
              {{ oracleResult.oracleAddress }}
            </div>
          </div>
          <div class="text-sm font-medium inline-block mb-2">
            Feed name:
            <div class="text-sm font-light inline-block">
              {{ oracleResult.dataFeed }}
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
              @click="addPriceAA"
            >
              Propose this perpetual
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
        <span>Great, soon the perpetual will be available for voting</span>
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
