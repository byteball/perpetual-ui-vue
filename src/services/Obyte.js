import obyte from "obyte";
import { getMetaForPerpAAs, getAasCreatedByFactory } from "@/services/DAGApi";
import { useAaInfoStore } from "@/stores/aaInfo";

const client = new obyte.Client(
  `wss://obyte.org/bb${
    import.meta.env.VITE_NETWORK === "testnet" ? "-test" : ""
  }`,
  {
    testnet: import.meta.env.VITE_NETWORK === "testnet",
    reconnect: true,
  }
);

client.onConnect(async () => {
  const store = useAaInfoStore();
  const { setAAs, setStatus, setMeta } = store;

  const aas = await getAasCreatedByFactory();
  setAAs(aas);

  const meta = await getMetaForPerpAAs(aas);
  setMeta(meta);
  setStatus("initialized");

  const heartbeat = setInterval(() => {
    client.api.heartbeat();
  }, 10 * 1000);

  client.client.ws.addEventListener("close", () => {
    clearInterval(heartbeat);
  });
});

export default client;
