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

export const generateDefinitionLink = (definition) => {
  return `obyte${
    import.meta.env.VITE_NETWORK === "testnet" ? "-tn" : ""
  }:data?app=definition&definition=${encodeURIComponent(
    JSON.stringify(definition, null, 4)
  )}`;
};

export function generateAndFollowLinkForVoteAddPriceAA(
  priceAA,
  vote,
  perpetualAA
) {
  const link = generateLink(
    10000,
    {
      vote_value: 1,
      name: "add_price_aa",
      price_aa: priceAA,
      value: vote,
    },
    null,
    perpetualAA,
    "base",
    true
  );

  const a = document.createElement("a");
  a.href = link;
  a.click();
}
