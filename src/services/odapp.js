import OClient from "odapp";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getInitData } from "@/services/MetaService";

const odapp = new OClient(import.meta.env.VITE_ODAPP_URL, true);

export const getAndSetInitData = async () => {
  const store = useAaInfoStore();
  const { setAAs, setStatus, setMeta, setAllPerpAAs } = store;

  const { aas, metaByAA, stakingAAs } = await getInitData();
  setAAs(aas);

  setAllPerpAAs([...aas, ...stakingAAs]);
  setAAs(aas);
  setMeta(metaByAA);
  setStatus("initialized");
};

export default odapp;
