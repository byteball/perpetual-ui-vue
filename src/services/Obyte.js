import obyte from "obyte";
import { getMetaForPerpAAs, getAasCreatedByFactory } from "@/services/DAGApi";
import emitter from "@/services/emitter";
import { useAaInfoStore } from "@/stores/aaInfo";

const factoryAaAdress = import.meta.env.VITE_FACTORY_AA;
const registryAaAdress = import.meta.env.VITE_REGISTRY_AA;

const aaEventNames = {
  [factoryAaAdress]: {
    request: `aa_request_${factoryAaAdress}`,
    response: `aa_response_${factoryAaAdress}`,
  },
  [registryAaAdress]: {
    request: `aa_request_${registryAaAdress}`,
    response: `aa_response_${registryAaAdress}`,
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
    aa: import.meta.env.VITE_FACTORY_AA,
  });

  client.justsaying("light/new_aa_to_watch", {
    aa: import.meta.env.VITE_REGISTRY_AA,
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
