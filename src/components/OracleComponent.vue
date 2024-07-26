<script setup>
import { ref, watch } from "vue";
import TextInput from "@/components/inputs/TextInput.vue";
import AutocompleteComponent from "@/components/AutocompleteComponent.vue";
import feedNamesByOracle from "@/feedNamesByOracle";
import { ADDRESSES } from "@/config";

import {
  getAssetBySymbol,
  getAssetMetadata,
  getDataFeed,
} from "@/services/DAGApi";
import { isValidAddress } from "@/utils/validates";
import debounce from "lodash.debounce";

const props = defineProps(["symbol", "withoutMetadata", "bigMargin"]);
const emit = defineEmits(["dataUpdated"]);

const oracleAddress = ref(ADDRESSES.default_oracle);
const addressIsValid = ref(false);
const dataFeed = ref("");

const error = ref("");
const value = ref(0);

async function getFeedNameList() {
  if (!addressIsValid.value) return [];
  return feedNamesByOracle[oracleAddress.value] || [];
}

watch(
  oracleAddress,
  () => {
    addressIsValid.value = isValidAddress(oracleAddress.value);
  },
  {
    immediate: true,
  }
);

watch(
  [oracleAddress, dataFeed],
  debounce(async () => {
    if (!oracleAddress.value || !dataFeed.value || !addressIsValid.value) {
      return emit("dataUpdated", {});
    }
    error.value = "";
    value.value = 0;

    const result = await getDataFeed(oracleAddress.value, dataFeed.value);

    if (!result) {
      return emit("dataUpdated", {
        error: "Data not found",
      });
    }
    const resultObj = {
      oracleAddress: oracleAddress.value,
      dataFeed: dataFeed.value,
      value: result,
    };

    if (!props.withoutMetadata) {
      const symbol = dataFeed.value.split("_")[0];
      const asset = await getAssetBySymbol(symbol);
      let symbolMetadata = null;
      if (asset) {
        symbolMetadata = await getAssetMetadata(asset);
      }
      resultObj.symbol = symbol;
      resultObj.symbolMetadata = symbolMetadata;
    }

    return emit("dataUpdated", resultObj);
  }, 500)
);

async function setDefaultDataFeed() {
  const list = await getFeedNameList();
  if (list.length) {
    let altName = props.symbol.match(/[A-Z]+/);
    altName = altName.length ? altName[0] : false;
    const r = list.find((v) => {
      return (
        v.startsWith(`${props.symbol}_`) ||
        (altName && v.startsWith(`${altName}_`))
      );
    });

    if (r) {
      dataFeed.value = r;
    } else {
      return emit("dataUpdated", {});
    }
  }
}

watch(
  () => props.symbol,
  () => {
    if (props.symbol && !dataFeed.value) {
      setDefaultDataFeed();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <TextInput
      v-model="oracleAddress"
      labelAttribute="Oracle address"
      tooltip-name="oracle"
    />
  </div>
  <div :class="bigMargin ? 'mt-4' : 'mt-2'">
    <AutocompleteComponent
      :get-src-for-auto-complete="getFeedNameList"
      v-model="dataFeed"
      placeholder="For example: GBYTE_USD"
      :label-attribute="'Feed name'"
      tooltip-name="feed_name"
    />
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
  color: #54585f !important;
}
</style>
