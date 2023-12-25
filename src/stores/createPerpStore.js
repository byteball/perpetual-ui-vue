import { computed, ref } from "vue";
import { defineStore } from "pinia";

function getState() {
  const state = localStorage.getItem("assetsState");
  if (state) return JSON.parse(state);
  return {};
}
export const useCreatePerpStore = defineStore("createPerp", () => {
  const assetsState = ref(getState());
  const currentAsset = ref("");

  const currentAssetState = computed(() => {
    return assetsState.value[currentAsset.value];
  });

  function getStateByAsset(asset) {
    currentAsset.value = asset;
    return assetsState.value[asset];
  }
  function setAssetState(asset, state) {
    assetsState.value[asset] = { ...assetsState.value[asset], ...state };
    currentAsset.value = asset;

    localStorage.setItem("assetsState", JSON.stringify(assetsState.value));
  }

  function removeAssetState(asset) {
    delete assetsState.value[asset];

    localStorage.setItem("assetsState", JSON.stringify(assetsState.value));
  }

  function setCurrentAssetState(state) {
    setAssetState(currentAsset.value, state);
  }

  return {
    assetsState,
    currentAssetState,
    getStateByAsset,
    setCurrentAssetState,
    setAssetState,
    removeAssetState,
  };
});
