import obyte from "obyte";
import { getMetaForPerpAAs, getAasCreatedByFactory } from "@/services/DAGApi";
import emitter from "@/services/emitter";
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

  client.justsaying("light/new_aa_to_watch", {
    aa: import.meta.env.VITE_FACTORY_AA,
  });

  client.subscribe(function (err, result) {
    if (err) return null;
    const { subject, body } = result[1];
    if (
      !subject ||
      !["light/aa_request", "light/aa_response"].includes(subject)
    ) {
      return null;
    }

    if (subject === "light/aa_request") {
      emitter.emit("aa_request", body);
    } else if (subject === "light/aa_response") {
      emitter.emit("aa_response", body);
    }
  });

  client.client.ws.addEventListener("close", () => {
    clearInterval(heartbeat);
  });
});

export default client;
