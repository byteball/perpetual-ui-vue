import obyte from "obyte";
import {
  getMetaForPerpAAs,
  getAasCreatedByFactory,
  clearCache,
} from "@/services/DAGApi";
import emitter from "@/services/emitter";
import { useAaInfoStore } from "@/stores/aaInfo";
import { ADDRESSES } from "@/config";

const aasForWatch = [
  ADDRESSES.factory_aa,
  ADDRESSES.registry_aa,
  ADDRESSES.reserve_price_usd,
  ADDRESSES.reserve_price_oswap,
];

let aas = [];
let allPerpAAs = [];
let isFirstConnect = true;
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

async function updateMeta() {
  const store = useAaInfoStore();
  const { setMeta } = store;
  clearCache();
  const meta = await getMetaForPerpAAs(aas);
  setMeta(meta);
}

client.onConnect(async () => {
  const store = useAaInfoStore();
  const { setAAs, setStatus, setMeta } = store;

  if (isFirstConnect) {
    aas = await getAasCreatedByFactory();
    setAAs(aas);

    const meta = await getMetaForPerpAAs(aas);
    const stakeAAs = Object.values(meta).map((v) => v.staking_aa);
    allPerpAAs = [...aas, ...stakeAAs];
    setAAs(aas);
    setMeta(meta);
    setStatus("initialized");
    isFirstConnect = false;
  }

  const heartbeat = setInterval(async () => {
    client.api.heartbeat();
  }, 10 * 1000);

  [...aasForWatch, ...allPerpAAs].forEach((aa) => {
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
      if (allPerpAAs.includes(body.aa_address)) return;
      emitter.emit(aaEventNames[body.aa_address].request, body);
      return;
    }

    if (subject === "light/aa_response") {
      if (allPerpAAs.includes(body.aa_address)) {
        updateMeta();
        return;
      }
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
