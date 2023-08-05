import obyte from "obyte";
import { getMetaForPerpAAs, getAasCreatedByFactory } from "@/services/DAGApi";
import emitter from "@/services/emitter";
import { useAaInfoStore } from "@/stores/aaInfo";

const factoryAa = import.meta.env.VITE_FACTORY_AA;
const registryAa = import.meta.env.VITE_REGISTRY_AA;

const aaEventNames = {
  [factoryAa]: {
    request: `aa_request_${factoryAa}`,
    response: `aa_response_${factoryAa}`,
  },
  [registryAa]: {
    request: `aa_request_${registryAa}`,
    response: `aa_response_${registryAa}`,
  },
};

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
    aa: factoryAa,
  });

  client.justsaying("light/new_aa_to_watch", {
    aa: registryAa,
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
      emitter.emit(aaEventNames[body.aa_address].request, body);
      return;
    }

    if (subject === "light/aa_response") {
      emitter.emit(aaEventNames[body.aa_address].response, body);
    }
  });

  client.client.ws.addEventListener("close", () => {
    clearInterval(heartbeat);
  });
});

export default client;
