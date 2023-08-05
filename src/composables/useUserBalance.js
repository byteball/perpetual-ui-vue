import { onMounted, ref, watch } from "vue";
import client from "@/services/Obyte";

export function useUserBalance(address) {
  let balance = ref({});

  async function updateBalance() {
    const b = await client.api.getBalances([address.value]);
    if (!b || !b[address.value]) {
      balance.value = {};
    }

    balance.value = b[address.value];
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
