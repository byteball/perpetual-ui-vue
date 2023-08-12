<script setup>
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { RouterView, useRoute } from "vue-router";
import { Dialog } from "@headlessui/vue";
import AddressController from "@/components/AddressController.vue";
import { useAddressStore } from "@/stores/addressStore";

const route = useRoute();

const store = useAddressStore();
const { address, addressModalIsOpen } = storeToRefs(store);

const isOpen = ref(false);

function hide() {
  console.log("click");
  isOpen.value = false;
  document.removeEventListener("click", hide);
}

function toggle(e) {
  e.preventDefault();
  if (e.target.open) {
    isOpen.value = true;
    document.addEventListener("click", hide);
  }
}
</script>

<template>
  <header>
    <div tabindex="0" class="navbar">
      <div class="navbar-start">
        <details class="dropdown" @toggle="toggle" :open="isOpen">
          <summary class="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </summary>
          <ul
            class="menu menu-sm menu-vertical dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52 z-50 block"
          >
            <li>
              <RouterLink
                to="/"
                :class="{ 'btn-active': route.name === 'market' }"
                >Market</RouterLink
              >
            </li>
            <li>
              <RouterLink
                to="/stake"
                :class="{ 'btn-active': route.name === 'stake' }"
                >Stake</RouterLink
              >
            </li>
            <li>
              <RouterLink
                to="/governance"
                :class="{ 'btn-active': route.name === 'governance' }"
                >Governance</RouterLink
              >
            </li>
            <li>
              <RouterLink
                to="/presale"
                :class="{ 'btn-active': route.name === 'presale' }"
                >Presale</RouterLink
              >
            </li>
            <li>
              <RouterLink
                to="/create"
                :class="{
                  'btn-active':
                    route.name === 'create' || route.name === 'createSymbols',
                }"
                >Create</RouterLink
              >
            </li>
            <li>
              <label
                class="select select-sm items-center bg-base-200 border-gray-600"
                @click="store.openAddressModal"
              >
                {{ address ? address.substring(0, 10) + "..." : "Add address" }}
              </label>
            </li>
          </ul>
        </details>
        <RouterLink class="hover:bg-none" to="/">
          <img src="/logo.svg" class="h-14 w-14" alt="pyth.ooo" />
        </RouterLink>
      </div>
      <div tabindex="0" class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal items-center px-1">
          <li>
            <RouterLink
              to="/"
              :class="{ 'btn-active': route.name === 'market' }"
              >Market</RouterLink
            >
          </li>
          <li>
            <RouterLink
              to="/stake"
              class="ml-2"
              :class="{ 'btn-active': route.name === 'stake' }"
              >Stake</RouterLink
            >
          </li>
          <li>
            <RouterLink
              to="/governance"
              class="ml-2"
              :class="{ 'btn-active': route.name === 'governance' }"
              >Governance</RouterLink
            >
          </li>
          <li>
            <RouterLink
              to="/presale"
              class="ml-2"
              :class="{ 'btn-active': route.name === 'presale' }"
              >Presale</RouterLink
            >
          </li>
          <li>
            <RouterLink
              to="/create"
              class="ml-2"
              :class="{
                'btn-active':
                  route.name === 'create' || route.name === 'createSymbols',
              }"
              >Create</RouterLink
            >
          </li>
          <li>
            <label
              class="select select-sm items-center bg-base-200 border-gray-600 ml-2"
              @click="store.openAddressModal"
            >
              {{ address ? address.substring(0, 10) + "..." : "Add address" }}
            </label>
          </li>
        </ul>
      </div>
      <div class="navbar-end"></div>
    </div>
    <nav class="menu"></nav>
    <Dialog
      :open="addressModalIsOpen"
      @close="store.closeAddressModal"
      class="relative z-50"
    >
      <div class="fixed inset-0 bg-black/[.8]" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center">
        <AddressController />
      </div>
    </Dialog>
  </header>

  <div tabindex="0">
    <RouterView />
  </div>
</template>

<style scoped>
.menu {
  flex-direction: row;
  padding: 16px;
}
</style>
