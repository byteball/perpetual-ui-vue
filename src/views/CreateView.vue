<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import debounce from "lodash.debounce";
import { generateLink } from "@/utils/generateLink";
import { clearObject } from "@/utils/clearObject";
import { parseDataForFactoryRequest } from "@/utils/parseDataForFactoryRequest";
import { getAssetMetadata } from "@/services/DAGApi";

import AutoComplete from "@tarekraafat/autocomplete.js";
import emitter from "@/services/emitter";

import Client from "@/services/Obyte";

const router = useRouter();

const awaiting = ref(false);
const link = ref("");
const reserveAssetInput = ref("");
const reserveAsset = ref("");
const swapFee = ref({ value: "0.003", error: "" });
const arbProfitTax = ref({ value: "0.9", error: "" });
const adjustmentPeriod = ref({ value: "", error: "" });
const presalePeriod = ref({ value: "", error: "" });
const auctionPriceHalvingPeriod = ref({ value: "", error: "" });
const tokenShareThreshhold = ref({ value: "", error: "" });
const minS0Share = ref({ value: "", error: "" });

const SI = ref();
const autoComplete = ref();
const assocAssetBySymbol = ref({});
const oswapAssets = ref({});

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
  SI.value.addEventListener("keydown", keyDown);

  autoComplete.value = new AutoComplete({
    name: "autoComplete",
    selector: "#assetInput",
    submit: true,
    placeHolder: "",
    data: {
      src: async (query) => {
        let assets = [];
        assets = [...Object.keys(oswapAssets.value), "GBYTE"];

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
  SI.value.removeEventListener("keydown", keyDown);
});

function setAwaiting(value) {
  awaiting.value = value;
}

emitter.on(`aa_request_${import.meta.env.VITE_FACTORY_AA}`, async (data) => {
  if (!awaiting.value) return;

  const _d = parseDataForFactoryRequest(data);
  const obj = clearObject({
    reserve_asset: reserveAsset.value,
    swap_fee: swapFee.value.value,
    arb_profit_tax: arbProfitTax.value.value,
    adjustment_period: adjustmentPeriod.value.value,
    presale_period: presalePeriod.value.value,
    auction_price_halving_period: auctionPriceHalvingPeriod.value.value,
    token_share_threshold: tokenShareThreshhold.value.value,
    min_s0_share: minS0Share.value.value,
  });

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
    tokenShareThreshhold,
    minS0Share,
  ],
  () => {
    link.value = generateLink(
      10000,
      clearObject({
        reserve_asset: reserveAsset.value,
        swap_fee: swapFee.value.value,
        arb_profit_tax: arbProfitTax.value.value,
        adjustment_period: adjustmentPeriod.value.value,
        presale_period: presalePeriod.value.value,
        auction_price_halving_period: auctionPriceHalvingPeriod.value.value,
        token_share_threshold: tokenShareThreshhold.value.value,
        min_s0_share: minS0Share.value.value,
      }),
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

watch(
  () => tokenShareThreshhold.value.value,
  () => {
    tokenShareThreshhold.value.error = "";

    const tokenShareThreshholdValue = tokenShareThreshhold.value.value;
    if (!tokenShareThreshholdValue) {
      return;
    }

    if (tokenShareThreshholdValue < 0) {
      tokenShareThreshhold.value.error = "Must be a non-negative number";
    }

    if (tokenShareThreshholdValue >= 1) {
      tokenShareThreshhold.value.error = "Must be less than 1";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => swapFee.value.value,
  () => {
    swapFee.value.error = "";

    const swapFeeValue = swapFee.value.value;
    if (!swapFeeValue) {
      return;
    }

    if (swapFeeValue < 0) {
      swapFee.value.error = "Must be a non-negative number";
    }

    if (swapFeeValue >= 1) {
      swapFee.value.error = "Must be less than 1";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => minS0Share.value.value,
  () => {
    minS0Share.value.error = "";

    const minS0ShareValue = minS0Share.value.value;
    if (!minS0ShareValue) {
      return;
    }

    if (minS0ShareValue < 0) {
      minS0Share.value.error = "Must be a non-negative number";
    }

    if (minS0ShareValue >= 1) {
      minS0Share.value.error = "Must be less than 1";
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => arbProfitTax.value.value,
  () => {
    arbProfitTax.value.error = "";

    const arbProfitTaxValue = arbProfitTax.value.value;
    if (!arbProfitTaxValue) {
      return;
    }

    if (arbProfitTaxValue < 0) {
      arbProfitTax.value.error = "Must be a non-negative number";
    }
  },
  {
    immediate: true,
  }
);

watch(
  reserveAssetInput,
  debounce(async () => {
    if (oswapAssets.value[reserveAssetInput.value]) {
      reserveAsset.value = oswapAssets.value[reserveAssetInput.value];
      return;
    }

    if (["GBYTE", "base"].includes(reserveAssetInput.value)) {
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
      return;
    }

    reserveAsset.value = "";
  }, 500)
);
</script>
<template>
  <div class="container w-[320px] sm:w-[512px] m-auto mt-8 mb-36 p-8">
    <div v-if="!awaiting" class="p-2 mb-6">
      <div class="text-lg font-semibold leading-7">Create</div>
      <p class="mt-2 leading-6">
        This information will be displayed publicly so be careful what you
        share.
      </p>
    </div>

    <div v-if="awaiting">
      <div class="alert shadow-lg">
        <div>
          <svg
            class="animate-spin h-5 w-5 ml-2 mr-3"
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
        <div class="flex-none">
          <button class="btn btn-sm btn-primary" @click="setAwaiting(false)">
            Cancel
          </button>
        </div>
      </div>
    </div>
    <div v-show="!awaiting">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <div class="!form-control">
            <label class="label">
              <span class="label-text">Reserve asset</span>
            </label>
            <input
              type="text"
              id="assetInput"
              ref="SI"
              v-model="reserveAssetInput"
              class="!input !input-bordered !w-full"
            />
          </div>
          <!--      <div class="form-control">-->
          <!--        <label class="label">-->
          <!--          <span class="label-text">Swap fee</span>-->
          <!--        </label>-->
          <!--        <input-->
          <!--          type="text"-->
          <!--          placeholder="Swap fee"-->
          <!--          v-model="swapFee.value"-->
          <!--          class="input input-bordered"-->
          <!--          :class="{ 'input-error': swapFee.error }"-->
          <!--        />-->
          <!--        <span-->
          <!--          v-if="swapFee.error"-->
          <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
          <!--        >-->
          <!--          {{ swapFee.error }}-->
          <!--        </span>-->
          <!--      </div>-->
          <!--      <div class="form-control">-->
          <!--        <label class="label">-->
          <!--          <span class="label-text">Arb profit tax</span>-->
          <!--        </label>-->
          <!--        <input-->
          <!--          type="text"-->
          <!--          placeholder="Arb profit tax"-->
          <!--          v-model="arbProfitTax.value"-->
          <!--          class="input input-bordered"-->
          <!--          :class="{ 'input-error': arbProfitTax.error }"-->
          <!--        />-->
          <!--        <span-->
          <!--          v-if="arbProfitTax.error"-->
          <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
          <!--        >-->
          <!--          {{ arbProfitTax.error }}-->
          <!--        </span>-->
          <!--      </div>-->
          <!--      <div class="form-control">-->
          <!--        <label class="label">-->
          <!--          <span class="label-text">Adjustment period</span>-->
          <!--        </label>-->
          <!--        <IntegerInput-->
          <!--          :inputType="'integer'"-->
          <!--          :inputProperty="adjustmentPeriod"-->
          <!--        />-->
          <!--        <span-->
          <!--          v-if="adjustmentPeriod.error"-->
          <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
          <!--        >-->
          <!--          {{ adjustmentPeriod.error }}-->
          <!--        </span>-->
          <!--      </div>-->
          <!--      <div class="form-control">-->
          <!--        <label class="label">-->
          <!--          <span class="label-text">Presale period</span>-->
          <!--        </label>-->
          <!--        <input-->
          <!--          type="text"-->
          <!--          placeholder="Presale period"-->
          <!--          v-model="presalePeriod.value"-->
          <!--          @input="handleIntegerInput"-->
          <!--          class="input input-bordered"-->
          <!--          :class="{ 'input-error': presalePeriod.error }"-->
          <!--        />-->
          <!--        <span-->
          <!--          v-if="presalePeriod.error"-->
          <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
          <!--        >-->
          <!--          {{ presalePeriod.error }}-->
          <!--        </span>-->
          <!--      </div>-->
          <!--      <div class="form-control">-->
          <!--        <label class="label">-->
          <!--          <span class="label-text">Auction price halving period</span>-->
          <!--        </label>-->
          <!--        <input-->
          <!--          type="text"-->
          <!--          placeholder="Auction price halving period"-->
          <!--          v-model="auctionPriceHalvingPeriod.value"-->
          <!--          @input="handleIntegerInput"-->
          <!--          class="input input-bordered"-->
          <!--          :class="{ 'input-error': auctionPriceHalvingPeriod.error }"-->
          <!--        />-->
          <!--        <span-->
          <!--          v-if="auctionPriceHalvingPeriod.error"-->
          <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
          <!--        >-->
          <!--          {{ auctionPriceHalvingPeriod.error }}-->
          <!--        </span>-->
          <!--      </div>-->
          <!--      <div class="form-control">-->
          <!--        <label class="label">-->
          <!--          <span class="label-text">Token share threshhold</span>-->
          <!--        </label>-->
          <!--        <input-->
          <!--          type="text"-->
          <!--          placeholder="Token share threshhold"-->
          <!--          v-model="tokenShareThreshhold.value"-->
          <!--          class="input input-bordered"-->
          <!--          :class="{ 'input-error': tokenShareThreshhold.error }"-->
          <!--        />-->
          <!--        <span-->
          <!--          v-if="tokenShareThreshhold.error"-->
          <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
          <!--        >-->
          <!--          {{ tokenShareThreshhold.error }}-->
          <!--        </span>-->
          <!--      </div>-->
          <!--      <div class="form-control">-->
          <!--        <label class="label">-->
          <!--          <span class="label-text">Min s0 share</span>-->
          <!--        </label>-->
          <!--        <input-->
          <!--          type="text"-->
          <!--          placeholder="Min s0 share"-->
          <!--          v-model="minS0Share.value"-->
          <!--          class="input input-bordered"-->
          <!--          :class="{ 'input-error': minS0Share.error }"-->
          <!--        />-->
          <!--        <span-->
          <!--          v-if="minS0Share.error"-->
          <!--          class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"-->
          <!--        >-->
          <!--          {{ minS0Share.error }}-->
          <!--        </span>-->
          <!--      </div>-->
          <div class="form-control mt-6">
            <a
              class="btn btn-primary"
              :href="link"
              :class="{ '!btn-disabled': reserveAsset === '' }"
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
