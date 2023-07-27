import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useAaInfoStore = defineStore("aaInfo", () => {
  const aas = ref([]);
  const status = ref("not_init");
  const meta = ref({});
  const timestamp = ref(Math.floor(Date.now() / 1000));

  const activeAddress = ref("");

  const metaByActiveAddress = computed(() => {
    if (activeAddress.value === "") return null;

    return meta.value[activeAddress.value];
  });

  function setAAs(_aas) {
    aas.value = _aas;
  }

  function setStatus(_status) {
    status.value = _status;
  }

  function setMeta(_meta) {
    meta.value = _meta;
  }

  function setActiveAddress(_activeAddress) {
    activeAddress.value = _activeAddress;
  }

  return {
    aas,
    status,
    meta,
    timestamp,
    activeAddress,
    metaByActiveAddress,
    setAAs,
    setStatus,
    setMeta,
    setActiveAddress,
  };
});
