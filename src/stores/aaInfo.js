import { ref } from "vue";
import { defineStore } from "pinia";

export const useAaInfoStore = defineStore("aaInfo", () => {
  const aas = ref([]);
  const status = ref("not_init");
  const meta = ref({});
  const timestamp = ref(Math.floor(Date.now() / 1000));

  function setAAs(_aas) {
    aas.value = _aas;
  }

  function setStatus(_status) {
    status.value = _status;
  }

  function setMeta(_meta) {
    meta.value = _meta;
  }

  return { aas, status, meta, timestamp, setAAs, setStatus, setMeta };
});
