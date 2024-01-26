import { isProxy, toRaw } from "vue";

export function cloneProxyToRaw(target) {
  target = isProxy(target) ? toRaw(target) : target;
  return structuredClone(target);
}
