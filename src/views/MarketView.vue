<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getAssetsFromMeta, getPairedAssetsByAsset } from "@/utils/assetsUtils";
import { generateLink } from "@/utils/generateLink";
import { getExchangeResultByState } from "@/utils/getExchangeResultByState";
import { transformAssetName } from "@/utils/transformAssetName";

const store = useAaInfoStore();
const { aas, meta, status } = storeToRefs(store);

const assets = ref({ assetList: [], assetsByAA: {} });
const asset1 = ref("");
const modalForAsset1 = ref();

function initSelectedAA() {
  if (status.value !== "initialized") return;
  console.log(meta.value);
  assets.value = getAssetsFromMeta(meta.value);
  console.log(assets.value.assetList);
  console.log(
    getPairedAssetsByAsset(
      "yYHAcj7gKKcXr2eJ0pnKBR6raMpCU6PEZ1HBD6uEP9M=",
      assets.value.assetsByAA
    )
  );
}

onMounted(() => {
  initSelectedAA();
});

watch(aas, initSelectedAA);
watch(status, initSelectedAA);

function setAsset1(asset) {
  asset1.value = asset;
  modalForAsset1.value.checked = false;
}
</script>

<template>
  <div class="w-[512px] m-auto mt-48 mb-36">
    <div v-if="!assets.assetList.length">Loading...</div>
    <div class="form-control" v-if="assets.assetList.length">
      <div class="input-group">
        <input type="text" placeholder="0" class="input input-bordered" />
        <label for="asset1Modal" class="btn">{{
          asset1 ? asset1 : "Select asset"
        }}</label>
      </div>
    </div>
  </div>

  <input
    ref="modalForAsset1"
    type="checkbox"
    id="asset1Modal"
    class="modal-toggle"
  />
  <label for="asset1Modal" class="modal cursor-pointer">
    <label class="modal-box relative" for="">
      <div
        v-for="asset in assets.assetList"
        :key="asset"
        class="my-2 mx-4 cursor-pointer hover:text-gray-600"
        @click="setAsset1(asset)"
      >
        {{ asset }}
      </div>
    </label>
  </label>
</template>

<style scoped></style>
