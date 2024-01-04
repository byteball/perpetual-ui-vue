<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { DialogPanel } from "@headlessui/vue";
import { event } from "vue-gtag";
import { useAddressStore } from "@/stores/addressStore";
import TextInput from "@/components/inputs/TextInput.vue";
import { isValidAddress } from "@/utils/validates";

const store = useAddressStore();
const { address } = storeToRefs(store);

const addressInput = ref("");
const changeMode = ref(false);

function addAddressEvent() {
  event("add_address");
}
function setAddress() {
  if (!addressInput.value || !isValidAddress(addressInput.value)) return;

  store.setAddress(addressInput.value);
  addAddressEvent();
  store.closeAddressModal();
}

watch(
  () => address.value,
  () => {
    addressInput.value = address.value;
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <DialogPanel class="card bg-base-200 rounded-2xl shadow-xl mb-4 w-[500px]">
    <div class="card-body p-4 sm:p-8">
      <div>
        <div class="text-xl text-center">
          <div v-if="!changeMode">Add your Obyte address</div>
          <div v-else>Change address</div>
        </div>
        <div class="mt-6">
          <TextInput
            name="obyte_address"
            v-model="addressInput"
            placeholder="Wallet address"
            @keyup.enter="setAddress"
          />
        </div>
        <div class="my-2">
          <a
            href="https://obyte.org/#download"
            class="text-primary"
            target="_blank"
            rel="noopener"
            >Install Obyte wallet</a
          >
          if you don't have one yet, and copy/paste your address here.
        </div>
        <div class="text-center mt-4">
          <button
            class="btn btn-primary"
            :class="{ '!btn-disabled': !isValidAddress(addressInput) }"
            @click="setAddress"
          >
            Save address
          </button>
        </div>
      </div>
    </div>
  </DialogPanel>
</template>

<style scoped></style>
