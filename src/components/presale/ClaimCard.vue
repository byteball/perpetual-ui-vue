<script setup>
import { onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { Dialog } from "@headlessui/vue";
import dayjs from "dayjs";
import { event } from "vue-gtag";

import { useAddressStore } from "@/stores/addressStore";
import { useAaInfoStore } from "@/stores/aaInfo";
import { getParam } from "@/utils/governanceUtils";
import { getAssetMetadata } from "@/services/DAGApi";
import { generateLink } from "@/utils/generateLink";
import { getTargetPriceByPresaleAsset } from "@/services/PerpAPI";

import WithdrawModal from "@/components/presale/WithdrawModal.vue";
import router from "@/router";
import LoadingIcon from "@/components/icons/LoadingIcon.vue";

const addressStore = useAddressStore();
const store = useAaInfoStore();

const emit = defineEmits(["openBuy"]);

const { address } = storeToRefs(addressStore);
const { meta } = storeToRefs(store);

const addressClaims = ref([]);
const assetsMetadata = ref({});
const modalForWithdraw = ref(false);
const dataForWithdraw = ref({});
const isLoaded = ref(false);

function setWithdrawModalData(data) {
  dataForWithdraw.value = data;
  modalForWithdraw.value = true;
}
function closeWithdrawModal() {
  modalForWithdraw.value = false;
}

const getPresaleStatus = (aa, presaleAsset) => {
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

  return {
    finishDate,
    finished:
      targetPresaleAmount < currentPresaleAmount ||
      !presaleAssetData?.presale ||
      finishDate.diff(dayjs()) < 0,
  };
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

  return generateLink(10000, data, null, aa, "base", true);
};

const prepareClaimPresaleByAddress = async () => {
  addressClaims.value = [];
  const list = [];

  for (const aa in meta.value) {
    const aaAddressContributions = Object.keys(meta.value[aa]).filter((key) =>
      key.includes(`contribution_${address.value}`)
    );

    if (aaAddressContributions.length === 0) continue;

    for (const aaAddressContribution of aaAddressContributions) {
      const presaleAsset = aaAddressContribution.split("_")[2];

      const reserveAsset = meta.value[aa].reserve_asset;

      await getAssetsMetadata(presaleAsset, reserveAsset);
      const presaleStatus = getPresaleStatus(aa, presaleAsset);
      let amount, name, decimals;
      if (presaleStatus.finished) {
        const targetPrice = await getTargetPriceByPresaleAsset(
          aa,
          presaleAsset
        );

        decimals = assetsMetadata.value[presaleAsset].decimals;
        const rawAmount =
          meta.value[aa][aaAddressContribution] / 10 ** decimals / targetPrice;
        amount = +rawAmount.toFixed(decimals);
        name = assetsMetadata.value[presaleAsset].name;
      } else {
        decimals = assetsMetadata.value[reserveAsset].decimals;
        amount = meta.value[aa][aaAddressContribution] / 10 ** decimals;
        name = name = assetsMetadata.value[reserveAsset].name;
      }

      list.push({
        aa,
        presaleAsset,
        reserveAsset,
        amount,
        name,
        decimals,
        isPresaleFinished: presaleStatus.finished,
        finishDate: presaleStatus.finishDate.format("MMMM D, YYYY HH:mm"),
        link: generateClaimLink(presaleAsset, reserveAsset, aa),
      });
    }
  }

  list.sort((a, b) => {
    if (a.isPresaleFinished && !b.isPresaleFinished) {
      return -1;
    } else if (!a.isPresaleFinished && b.isPresaleFinished) {
      return 1;
    }

    if (a.amount > b.amount) {
      return 1;
    }

    if (a.amount < b.amount) {
      return -1;
    }

    return 0;
  });
  addressClaims.value = list;
};

function setBuy(asset) {
  router.push(`/presale/${asset}`);
  emit("openBuy");
}

function claimEvent(aa, asset, amount) {
  event("claim_presale", {
    event_category: aa,
    event_label: asset,
    value: amount,
  });
}

watch(meta, prepareClaimPresaleByAddress);

watch(() => address.value, prepareClaimPresaleByAddress);

onMounted(async () => {
  await prepareClaimPresaleByAddress();
  isLoaded.value = true;
});
</script>

<template>
  <div v-if="!isLoaded" class="text-center">
    <LoadingIcon />
  </div>
  <div v-else-if="addressClaims.length">
    <div class="text-sm text-center">
      <div class="font-bold text-center sm:text-left flex items-center mb-2">
        Claim or withdraw your tokens
      </div>
      <table class="table w-full mt-4">
        <thead>
          <tr>
            <th>Token</th>
            <th>Amount</th>
            <th class="text-center">Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="claim in addressClaims" :key="claim.presaleAsset">
            <td>
              {{ assetsMetadata[claim.presaleAsset].name }}
            </td>
            <td>{{ claim.amount }} {{ claim.name }}</td>
            <td class="text-center min-w-[162px]">
              <template v-if="claim.isPresaleFinished"
                >Presale is completed</template
              >
              <template v-else
                >Presale ends on:<br />{{ claim.finishDate }}</template
              >
            </td>
            <td class="min-w-[128px]">
              <a
                class="link text-sky-500 link-hover"
                :href="claim.link"
                @click="claimEvent(claim.aa, claim.presaleAsset, claim.amount)"
                v-if="claim.isPresaleFinished"
              >
                claim
              </a>
              <template v-else>
                <a
                  class="link text-sky-500 link-hover mr-2"
                  @click="setBuy(claim.presaleAsset)"
                  >Buy</a
                >
                <a
                  class="link text-sky-500 link-hover"
                  @click="setWithdrawModalData(claim)"
                  >withdraw</a
                >
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="mt-2 leading-6">No tokens to claim</div>
  <Dialog
    :open="modalForWithdraw"
    @close="closeWithdrawModal()"
    class="relative z-50"
  >
    <div class="fixed inset-0 bg-black/[.8]" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center">
      <WithdrawModal
        :dataForWithdraw="dataForWithdraw"
        :assets-metadata="assetsMetadata"
      />
    </div>
  </Dialog>
</template>

<style scoped></style>
