import { ref } from "vue";
import { defineStore } from "pinia";

export const useAaInfoStore = defineStore("aaInfo", () => {
  const aas = ref([]);
  const status = ref("not_init");
  const meta = ref({});

  function setAAs(_aas) {
    aas.value = _aas;
  }

  function setStatus(_status) {
    status.value = _status;
  }

  function setMeta(_meta) {
    meta.value = _meta;
  }

  return { aas, status, meta, setAAs, setStatus, setMeta };
});
