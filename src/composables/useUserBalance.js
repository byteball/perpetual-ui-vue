import { onMounted, onUnmounted, ref, watch } from "vue";
import client from "@/services/Obyte";

export function useUserBalance(address) {
  let intervalId;
  const balance = ref({});

  async function updateBalance() {
    if (!address.value) return;
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
  }

  watch(() => address, updateBalance);

  onMounted(() => {
    updateBalance();
    intervalId = setInterval(updateBalance, 60 * 1000);
  });

  onUnmounted(() => {
    clearInterval(intervalId);
  });

  return {
    balance,
    updateBalance,
  };
}
