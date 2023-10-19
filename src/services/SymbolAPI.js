import { getAssetBySymbol, getAssetMetadata } from "@/services/DAGApi";

export async function getMetadataForSymbolByDataFeed(dataFeed) {
  const symbol = dataFeed.split("_")[0];
  const asset = await getAssetBySymbol(symbol);
  if (!asset) return null;

  const metadata = await getAssetMetadata(asset);
  return metadata || null;
}
