import { ref } from "vue";
import { defineStore } from "pinia";

const ADDRESS = "ob_address";

function getAddress() {
  return localStorage.getItem(ADDRESS) || "";
}

function saveAddress(address) {
  localStorage.setItem(ADDRESS, address);
}

export const useAddressStore = defineStore("address", () => {
  const address = ref(getAddress());

  function setAddress(_address) {
    address.value = _address;
    saveAddress(_address);
  }

  return { address, setAddress };
});
