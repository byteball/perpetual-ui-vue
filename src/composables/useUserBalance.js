import { onMounted, ref, watch } from "vue";
import client from "@/services/Obyte";

export function useUserBalance(address) {
  const balance = ref({});

  async function updateBalance() {
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
    setTimeout(updateBalance, 60000);
  }

  if (address.value) {
    updateBalance();
    onMounted(updateBalance);
  }
  watch(() => address, updateBalance);

  return {
    balance,
    updateBalance,
  };
}
