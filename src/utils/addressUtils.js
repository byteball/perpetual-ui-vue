import { utils } from "obyte";

export function getAddressByBaseAA(aa, params) {
  return utils.getChash160([
    "autonomous agent",
    {
      base_aa: aa,
      params: params,
    },
  ]);
}

export function getAddressByDefinition(definition) {
  return utils.getChash160(definition);
}
