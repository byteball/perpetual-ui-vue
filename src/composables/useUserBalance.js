import { onBeforeMount, onUnmounted, ref, watch } from "vue";
import { getBalances } from "@/services/DAGApi";

export function useUserBalance(address) {
  let intervalId;
  const balance = ref({});
  const balanceIsLoaded = ref(false);

  async function updateBalance() {
    if (!address.value) {
      balanceIsLoaded.value = true;
      return;
    }
    let b;
    try {
      b = await getBalances(address.value);
    } catch (e) {
      //
    }

    if (b) {
      balance.value = b[address.value] || {};
    }
    balanceIsLoaded.value = true;
  }

  watch(() => address, updateBalance);

  onBeforeMount(() => {
    updateBalance();
    intervalId = setInterval(updateBalance, 60 * 1000);
  });

  onUnmounted(() => {
    clearInterval(intervalId);
  });

  return {
    balance,
    balanceIsLoaded,
    updateBalance,
  };
}
