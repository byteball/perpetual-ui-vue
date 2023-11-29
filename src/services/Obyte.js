import obyte from "obyte";
import { getMetaForPerpAAs, getAasCreatedByFactory } from "@/services/DAGApi";
import emitter from "@/services/emitter";
import { useAaInfoStore } from "@/stores/aaInfo";
import { ADDRESSES } from "@/config";

const aasForWatch = [
  ADDRESSES.factory_aa,
  ADDRESSES.registry_aa,
  ADDRESSES.reserve_price_usd,
  ADDRESSES.reserve_price_oswap,
];

const aaEventNames = {};
aasForWatch.forEach((aa) => {
  aaEventNames[aa] = {
    request: `aa_request_${aa}`,
    response: `aa_response_${aa}`,
    definition: `aa_definition_${aa}`,
    definition_saved: `aa_definition_saved_${aa}`,
  };
});

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

  aasForWatch.forEach((aa) => {
    client.justsaying("light/new_aa_to_watch", {
      aa,
    });
  });

  client.subscribe(function (err, result) {
    if (err) return null;
    const { subject, body } = result[1];
    if (!subject || !subject.startsWith("light/aa_")) {
      return null;
    }

    if (subject === "light/aa_request") {
      emitter.emit(aaEventNames[body.aa_address].request, body);
      return;
    }

    if (subject === "light/aa_response") {
      emitter.emit(aaEventNames[body.aa_address].response, body);
      return;
    }

    if (subject === "light/aa_definition") {
      const message = body.messages.find((m) => m.app === "definition");
      if (message) {
        const address = message.payload.definition[1].base_aa;
        emitter.emit(aaEventNames[address].definition, {
          payload: message.payload,
          body,
        });
      }
      return;
    }

    if (subject === "light/aa_definition_saved") {
      const message = body.messages.find((m) => m.app === "definition");
      if (message) {
        const address = message.payload.definition[1].base_aa;
        emitter.emit(aaEventNames[address].definition_saved, {
          payload: message.payload,
          body,
        });
      }
    }
  });

  client.client.ws.addEventListener("close", () => {
    clearInterval(heartbeat);
  });
});

export default client;
