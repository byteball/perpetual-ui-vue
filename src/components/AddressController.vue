<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAddressStore } from "@/stores/addressStore";
import { utils } from "obyte";

const store = useAddressStore();
const { address } = storeToRefs(store);

const addressInput = ref("");
const changeMode = ref(false);
const isHidden = ref(true);
const isValidAddress = ref(false);

function setAddress() {
  if (!addressInput.value) return;

  store.setAddress(addressInput.value);

  if (changeMode.value) {
    toggleChangeMode();
  }
}

function toggleChangeMode() {
  changeMode.value = !changeMode.value;
}

function showAddressBlock() {
  isHidden.value = false;
}

watch(
  () => addressInput.value,
  () => {
    isValidAddress.value = utils.isValidAddress(addressInput.value);
  }
);

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
  <div class="card bg-base-200 shadow-xl mb-4">
    <div class="card-body p-4 sm:p-8">
      <div v-if="isHidden && !address">
        <div class="text-sm">
          <div>For your convenience, you can add your Obyte address.</div>
          <div><a class="link" @click="showAddressBlock">Add address</a></div>
        </div>
      </div>
      <div v-else-if="!address || changeMode">
        <div class="text-xl">
          <div v-if="!changeMode">
            Please add your Obyte address for
            {{ notReq ? "your convenience" : "continue" }}
          </div>
          <div v-else>Change address</div>
        </div>
        <div class="mt-6">
          <input
            type="text"
            name="obyte_address"
            v-model="addressInput"
            placeholder="Wallet address"
            class="input input-bordered w-full"
          />
        </div>
        <div class="text-center mt-2.5">
          <button
            class="btn btn-primary"
            :class="{ '!btn-disabled': !isValidAddress }"
            @click="setAddress"
          >
            Save address
          </button>
        </div>
      </div>
      <div v-else>
        <div class="text-sm">
          Your address: {{ address }}
          <a class="link" @click="toggleChangeMode">Change address</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
