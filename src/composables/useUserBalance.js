import { onBeforeMount, onUnmounted, ref, watch } from "vue";
import client from "@/services/Obyte";

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
      b = await client.api.getBalances([address.value]);
    } catch (e) {
      //
    }

    if (b) {
      balance.value = b;
      balance.value = b[address.value];
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
