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
  const addressModalIsOpen = ref(false);

  function setAddress(_address) {
    address.value = _address;
    saveAddress(_address);
  }

  function openAddressModal() {
    addressModalIsOpen.value = true;
  }

  function closeAddressModal() {
    addressModalIsOpen.value = false;
  }

  return {
    address,
    addressModalIsOpen,
    setAddress,
    openAddressModal,
    closeAddressModal,
  };
});
