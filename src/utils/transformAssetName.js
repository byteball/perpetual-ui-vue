export function transformAssetName(name) {
  if (name === "base") {
    return "bytes";
  }

  if (name.length < 20) return name;
  return name.substring(0, 20) + "...";
}
