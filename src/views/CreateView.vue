<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import debounce from "lodash.debounce";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import { generateLink } from "@/utils/generateLink";
import { clearObject } from "@/utils/clearObject";
import { parseDataForFactoryRequest } from "@/utils/parseDataForFactoryRequest";
import { getAssetMetadata, getAssetMetadataByArray } from "@/services/DAGApi";

import AutoComplete from "@tarekraafat/autocomplete.js";
import emitter from "@/services/emitter";

import Client from "@/services/Obyte";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";
import { ChevronRightIcon } from "@heroicons/vue/20/solid";
import VoteInput from "@/components/inputs/VoteInput.vue";
import { convertObjectFieldValues } from "@/utils/convertValue";
import TooltipComponent from "@/components/TooltipComponent.vue";
import { isValidUnit } from "@/utils/validates";

const store = useAaInfoStore();
const { meta } = storeToRefs(store);

const router = useRouter();

const awaiting = ref(false);
const link = ref("");
const reserveAssetInput = ref("");
const reserveAsset = ref("");
const swapFee = ref("3");
const arbProfitTax = ref("90");
const adjustmentPeriod = ref("3");
const presalePeriod = ref("14");
const auctionPriceHalvingPeriod = ref("3");
const tokenShareThreshold = ref("10");
const minS0Share = ref("1");

const SI = ref();
const autoComplete = ref();
const assocAssetBySymbol = ref({});
const oswapAssets = ref({});
const existsError = ref("");
const poolNameExistsAA = ref("");

function keyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const matches = autoComplete.value.feedback
      ? autoComplete.value.feedback.matches
      : [];

    if (!matches.length) return;

    if (autoComplete.value.cursor === -1) {
      reserveAssetInput.value = matches[0].value;
      autoComplete.value.close();
      return;
    }

    if (matches[autoComplete.value.cursor]) {
      reserveAssetInput.value = matches[autoComplete.value.cursor].value;
    }
  }
}

async function getOswapPoolsAndSymbols() {
  const assetsBySymbol = {};

  const vars = await Client.api.getAaStateVars({
    address: import.meta.env.VITE_OSWAP_FACTORY,
  });

  for (let k in vars) {
    if (k.startsWith("pool_")) {
      const asset = vars[k].pool_asset;
      const assetMeta = await getAssetMetadata(asset);
      if (assetMeta) {
        assetsBySymbol[assetMeta.name] = asset;
      }
    }
  }

  return assetsBySymbol;
}

onMounted(async () => {
  const registry = Client.api.getOfficialTokenRegistryAddress();
  oswapAssets.value = await getOswapPoolsAndSymbols();
  if (SI.value) SI.value.addEventListener("keydown", keyDown);

  autoComplete.value = new AutoComplete({
    name: "autoComplete",
    selector: "#assetInput",
    submit: true,
    placeHolder: "",
    data: {
      src: async (query) => {
        let assets = [...Object.keys(oswapAssets.value), "GBYTE"];

        const asset = await Client.api.getAssetBySymbol(registry, query);
        if (asset) {
          assets = [...assets, query];
          assocAssetBySymbol.value = {
            ...oswapAssets.value,
            ...{ [query]: asset },
          };
        } else {
          assocAssetBySymbol.value = { ...oswapAssets.value };
        }

        return assets;
      },
      filter: (list) => {
        const inputValue = autoComplete.value.input.value.toLowerCase();
        const mostSimilar = [];
        const similar = list.filter((el) => {
          if (!el.value.toLowerCase().startsWith(inputValue)) {
            return true;
          }

          mostSimilar.push(el);
          return false;
        });

        return [...mostSimilar, ...similar];
      },
    },
    resultsList: {
      maxResults: 20,
    },
    resultItem: {
      highlight: true,
    },
    events: {
      input: {
        selection: (e) => {
          if (e.detail.event.type === "click") {
            reserveAssetInput.value = e.detail.selection.value;
          }
        },
      },
    },
  });
});

onBeforeUnmount(() => {
  if (SI.value) SI.value.removeEventListener("keydown", keyDown);
});

function setAwaiting(value) {
  awaiting.value = value;
}

function getObj() {
  const obj = clearObject({
    reserve_asset: reserveAsset.value,
    swap_fee: swapFee.value,
    arb_profit_tax: arbProfitTax.value,
    adjustment_period: adjustmentPeriod.value,
    presale_period: presalePeriod.value,
    auction_price_halving_period: auctionPriceHalvingPeriod.value,
    token_share_threshold: tokenShareThreshold.value,
    min_s0_share: minS0Share.value,
  });

  convertObjectFieldValues(obj);

  return obj;
}

emitter.on(`aa_request_${import.meta.env.VITE_FACTORY_AA}`, async (data) => {
  if (!awaiting.value) return;

  const _d = parseDataForFactoryRequest(data);
  const obj = getObj();

  if (JSON.stringify(_d) === JSON.stringify(obj)) {
    const result = await Client.api.dryRunAa({
      trigger: {
        address: "K237YYRMBYWCJBLSZGLJTXLZVVEXLI2Y",
        outputs: {
          base: 10000,
        },
        data: obj,
      },
      address: import.meta.env.VITE_FACTORY_AA, // sent to AA address
    });
    const r = result.find(
      (r) => r.aa_address === import.meta.env.VITE_FACTORY_AA
    );
    if (r.response?.responseVars?.address) {
      const address = r.response.responseVars.address;
      await router.push(`/create/${address}`);
    }
  }
});

watch(
  [
    reserveAsset,
    swapFee,
    arbProfitTax,
    adjustmentPeriod,
    presalePeriod,
    auctionPriceHalvingPeriod,
    tokenShareThreshold,
    minS0Share,
  ],
  async () => {
    if (!reserveAsset.value) return;
    link.value = "";
    await checkAAForAlreadyExisting();

    link.value = generateLink(
      10000,
      getObj(),
      null,
      import.meta.env.VITE_FACTORY_AA,
      "base",
      true
    );
  },
  {
    immediate: true,
    deep: true,
  }
);

// async function checkAsset() {
//   reserveAsset.value.error = "";
//
//   const reserverAssetValue = reserveAsset.value.value;
//   if (!reserverAssetValue) {
//     return;
//   }
//
//   if (
//     reserverAssetValue === "base" ||
//     reserverAssetValue.toUpperCase() === "GBYTE" ||
//     reserverAssetValue.toUpperCase() === "GB"
//   ) {
//     return;
//   }
//
//   const joint = await getJoint(reserverAssetValue);
//
//   if (
//     !joint ||
//     !joint.joint.unit.messages.find((m) => m.app === "definition")
//   ) {
//     reserveAsset.value.error = "Asset not found";
//   }
// }

async function getNameForExistsAA(address) {
  poolNameExistsAA.value = "";
  const metaByAA = meta.value[address];
  const reserveAsset = metaByAA.reserve_asset;
  const asset0 = metaByAA.state.asset0;

  const metadata = await getAssetMetadataByArray([reserveAsset, asset0]);
  if (!metadata[reserveAsset] || !metadata[asset0]) {
    return (poolNameExistsAA.value = "");
  }

  poolNameExistsAA.value = `(${metadata[reserveAsset].name}/${metadata[asset0].name})`;
}

async function checkAAForAlreadyExisting() {
  const result = await Client.api.dryRunAa({
    trigger: {
      address: import.meta.env.VITE_FACTORY_AA,
      outputs: {
        base: 10000,
      },
      data: getObj(),
    },
    address: import.meta.env.VITE_FACTORY_AA, // sent to AA address
  });

  if (result[0].response.error) {
    existsError.value = result[0].response.error;
    await getNameForExistsAA(existsError.value.substring(27));
    return;
  }

  existsError.value = "";
}

watch(
  reserveAssetInput,
  debounce(async () => {
    existsError.value = "";
    if (oswapAssets.value[reserveAssetInput.value]) {
      reserveAsset.value = oswapAssets.value[reserveAssetInput.value];
      return;
    }

    if (["GBYTE", "BYTES"].includes(reserveAssetInput.value.toUpperCase())) {
      reserveAsset.value = "base";
      return;
    }

    const registry = Client.api.getOfficialTokenRegistryAddress();
    const asset = await Client.api.getAssetBySymbol(
      registry,
      reserveAssetInput.value
    );

    if (asset) {
      reserveAsset.value = asset;
    } else if (isValidUnit(reserveAssetInput.value)) {
      reserveAsset.value = reserveAssetInput.value;
    } else {
      reserveAsset.value = "";
    }
  }, 500)
);
</script>
<template>
  <div class="container w-full sm:w-[512px] m-auto mt-8 mb-36 p-6 sm:p-8">
    <div v-if="!awaiting" class="p-2 mb-6">
      <div class="text-lg font-semibold leading-7">Create</div>
      <p class="mt-2 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </p>
    </div>

    <div v-if="awaiting">
      <div class="card bg-base-200 shadow-lg p-8">
        <div class="flex items-center">
          <svg
            class="animate-spin w-14 ml-2 mr-3"
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
          <span>Waiting for transaction creation</span>
        </div>
        <div class="mt-4 text-center">
          <button class="btn btn-sm btn-primary" @click="setAwaiting(false)">
            Cancel
          </button>
        </div>
      </div>
    </div>
    <div v-show="!awaiting">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body p-6 sm:p-8">
          <div class="!form-control">
            <label class="label">
              <span class="label-text">Reserve asset</span>
            </label>
            <input
              type="text"
              id="assetInput"
              ref="SI"
              v-model="reserveAssetInput"
              class="!input !input-bordered !w-full !text-slate-200 !bg-base-200 !border-gray-600"
              placeholder="For example: IUSD"
            />
          </div>
          <div class="form-control">
            <div class="flex items-center">
              <label class="label">
                <span class="label-text">Swap fee</span>
              </label>
              <TooltipComponent field-name="swap_fee"></TooltipComponent>
            </div>
            <label>
              <VoteInput v-model="swapFee" :type="'percent'" label="%" />
            </label>
          </div>
          <Disclosure v-slot="{ open }">
            <DisclosureButton class="py-2 text-gray-500 flex items-center">
              <span>Show all details</span>
              <ChevronRightIcon
                :class="open && 'rotate-90 transform'"
                class="w-5"
              />
            </DisclosureButton>
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-out"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <DisclosurePanel>
                <div class="form-control">
                  <div class="flex items-center">
                    <label class="label">
                      <span class="label-text">Arb profit tax</span>
                    </label>
                    <TooltipComponent field-name="arb_profit_tax">
                    </TooltipComponent>
                  </div>
                  <label>
                    <VoteInput
                      v-model="arbProfitTax"
                      :type="'percent'"
                      label="%"
                    />
                  </label>
                </div>
                <div class="form-control">
                  <div class="flex items-center">
                    <label class="label">
                      <span class="label-text">Adjustment period</span>
                    </label>
                    <TooltipComponent field-name="adjustment_period">
                    </TooltipComponent>
                  </div>
                  <label>
                    <VoteInput
                      v-model="adjustmentPeriod"
                      :type="'date'"
                      label="days"
                    />
                  </label>
                </div>
                <div class="form-control">
                  <div class="flex items-center">
                    <label class="label">
                      <span class="label-text">Presale period</span>
                    </label>
                    <TooltipComponent field-name="presale_period">
                    </TooltipComponent>
                  </div>
                  <label>
                    <VoteInput
                      v-model="presalePeriod"
                      :type="'date'"
                      label="days"
                    />
                  </label>
                </div>
                <div class="form-control">
                  <div class="flex items-center">
                    <label class="label">
                      <span class="label-text"
                        >Auction price halving period</span
                      >
                    </label>
                    <TooltipComponent field-name="auction_price_halving_period">
                    </TooltipComponent>
                  </div>
                  <label>
                    <VoteInput
                      v-model="auctionPriceHalvingPeriod"
                      :type="'date'"
                      label="days"
                    />
                  </label>
                </div>
                <div class="form-control">
                  <div class="flex items-center">
                    <label class="label">
                      <span class="label-text">Token share threshold</span>
                    </label>
                    <TooltipComponent field-name="token_share_threshold">
                    </TooltipComponent>
                  </div>
                  <label>
                    <VoteInput
                      v-model="tokenShareThreshold"
                      :type="'percent'"
                      label="%"
                    />
                  </label>
                </div>
                <div class="form-control">
                  <div class="flex items-center">
                    <label class="label">
                      <span class="label-text">Min s0 share</span>
                    </label>
                    <TooltipComponent field-name="min_s0_share">
                    </TooltipComponent>
                  </div>
                  <label>
                    <VoteInput
                      v-model="minS0Share"
                      :type="'percent'"
                      label="%"
                    />
                  </label>
                </div>
              </DisclosurePanel>
            </transition>
          </Disclosure>
          <div v-if="existsError" class="my-4 text-red-500">
            {{ existsError }} {{ poolNameExistsAA }}
          </div>
          <div class="form-control mt-6">
            <a
              class="btn btn-primary"
              :href="link"
              :class="{
                '!btn-disabled':
                  reserveAsset === '' || existsError || link === '',
              }"
              @click="setAwaiting(true)"
              >Create</a
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.autoComplete_wrapper > ul > li mark {
  color: #641ae6 !important;
}

.autoComplete_wrapper > ul {
  position: absolute;
  background-color: #2a303c;
  border: 1px solid #424955;
}

.autoComplete_wrapper > ul > li {
  background-color: #2a303c;
  border-radius: 0;
  color: #a6adba !important;
}

.autoComplete_wrapper > input::placeholder {
  color: #a6adba !important;
}
</style>
