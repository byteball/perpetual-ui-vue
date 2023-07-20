<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";

import { useAddressStore } from "@/stores/addressStore";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getParam } from "@/utils/governanceUtils";
import { executeAAGetter, getAssetMetadata } from "@/services/DAGApi";
import { generateLink } from "@/utils/generateLink";

const addressStore = useAddressStore();
const store = useAaInfoStore();

const { address } = storeToRefs(addressStore);
const { meta } = storeToRefs(store);

const addressClaims = ref([]);
const assetsMetadata = ref({});

const isPresaleFinished = (aa, presaleAsset) => {
  const presalePeriod = getParam("presale_period", meta.value[aa]);
  const tokenShareThreshold = getParam("token_share_threshold", meta.value[aa]);
  const reserve = meta.value[aa].state.reserve;

  const presaleAssetData = meta.value[aa][`asset_${presaleAsset}`];
  const currentPresaleAmount =
    meta.value[aa][`asset_${presaleAsset}`].presale_amount;

  const finishDate = dayjs(
    (presaleAssetData.creation_ts + presalePeriod) * 1000
  );

  const targetPresaleAmount = tokenShareThreshold * reserve;

  return (
    targetPresaleAmount <= currentPresaleAmount ||
    !presaleAssetData?.presale ||
    finishDate.diff(dayjs()) < 0
  );
};

const getAssetsMetadata = async (presaleAsset, reserveAsset) => {
  if (!assetsMetadata.value[presaleAsset]) {
    assetsMetadata.value[presaleAsset] = await getAssetMetadata(presaleAsset);
  }

  if (!assetsMetadata.value[reserveAsset]) {
    assetsMetadata.value[reserveAsset] = await getAssetMetadata(reserveAsset);
  }
};

const generateClaimLink = (presaleAsset, reserveAsset, aa) => {
  const data = {
    asset: presaleAsset,
    claim: 1,
  };

  return generateLink(10000, data, null, aa, reserveAsset, true);
};

const getPrice = async (aa, presaleAsset) => {
  if (meta.value[aa][`asset_${presaleAsset}`].initial_price) {
    return meta.value[aa][`asset_${presaleAsset}`].initial_price;
  }

  const priceAA = meta.value[aa][`asset_${presaleAsset}`].price_aa;
  return executeAAGetter(priceAA, "get_target_price");
};

const prepareClaimPresaleByAddress = async () => {
  addressClaims.value = [];

  for (const aa in meta.value) {
    const aaAddressContributions = Object.keys(meta.value[aa]).filter((key) =>
      key.includes(`contribution_${address.value}`)
    );

    if (aaAddressContributions.length === 0) continue;

    for (const aaAddressContribution of aaAddressContributions) {
      const presaleAsset = aaAddressContribution.split("_")[2];

      if (!isPresaleFinished(aa, presaleAsset)) continue;

      const reserveAsset = meta.value[aa].reserve_asset;

      await getAssetsMetadata(presaleAsset, reserveAsset);

      const price = await getPrice(aa, presaleAsset);

      const amount =
        meta.value[aa][aaAddressContribution] /
        price /
        10 ** assetsMetadata.value[presaleAsset].decimals;

      addressClaims.value.push({
        aa,
        presaleAsset,
        reserveAsset,
        amount: amount.toFixed(assetsMetadata.value[presaleAsset].decimals),
        link: generateClaimLink(presaleAsset, reserveAsset, aa),
      });
    }
  }
};

watch(meta, prepareClaimPresaleByAddress);

watch(() => address.value, prepareClaimPresaleByAddress);

onMounted(async () => {
  await prepareClaimPresaleByAddress();
});
</script>

<template>
  <div v-if="addressClaims.length" class="card bg-base-200 shadow-xl mb-4">
    <div class="card-body">
      <div class="text-sm text-center">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Presale</th>
              <th>Amount</th>
              <th>Claim</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="claim in addressClaims" :key="claim.presaleAsset">
              <td>
                {{ assetsMetadata[claim.presaleAsset].name }}
              </td>
              <td>
                {{ claim.amount }}
              </td>
              <td>
                <a class="link text-sky-500 link-hover" :href="claim.link">
                  claim
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
