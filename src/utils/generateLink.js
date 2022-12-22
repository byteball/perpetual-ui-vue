import { encodeData } from "./encodeData";

export const generateLink = (amount, data, address, AA, asset, is_single) => {
  const sData = encodeData(data);
  return `obyte${
    import.meta.env.VITE_NETWORK === "testnet" ? "-tn" : ""
  }:${AA}?amount=${amount}&base64data=${encodeURIComponent(
    sData
  )}&from_address=${address || ""}&single_address=${
    is_single ? "1" : ""
  }&asset=${encodeURIComponent(asset || "base")}`;
};
