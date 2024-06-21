<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faDiscord,
  faTelegram,
  faTwitter,
  faWeixin,
  faYoutube,
  faMedium,
  faBitcoin,
  faReddit,
  faFacebook,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";

library.add(
  faDiscord,
  faTelegram,
  faTwitter,
  faWeixin,
  faYoutube,
  faMedium,
  faBitcoin,
  faReddit,
  faFacebook,
  faGithub
);

const links = [
  {
    name: "discord",
    href: "https://discord.obyte.org/",
  },
  {
    name: "telegram",
    href: "https://t.me/obyteorg",
  },
  {
    name: "weixin",
    href: "https://mp.weixin.qq.com/s/JB0_MlK6w--D6pO5zPHAQQ",
  },
  {
    name: "twitter",
    href: "https://twitter.com/ObyteOrg",
  },
  {
    name: "youtube",
    href: "https://www.youtube.com/@ObyteOrg",
  },
  {
    name: "medium",
    href: "https://blog.obyte.org",
  },
  {
    name: "reddit",
    href: "https://www.reddit.com/r/obyte/",
  },
  {
    name: "bitcoin",
    href: "https://bitcointalk.org/index.php?topic=1608859.0",
  },
  {
    name: "facebook",
    href: "https://www.facebook.com/obyte.org",
  },
  {
    name: "github",
    href: "https://github.com/byteball/perpetual-aa",
  },
];
</script>

<template>
  <footer
    class="absolute bottom-0 p-10 text-sm rounded footer footer-center bg-base-200 text-base-content gap-y-6"
  >
    <nav>
      <div class="flex flex-wrap justify-center grid-flow-col gap-4 sm:grid">
        <a
          v-for="link in links"
          :key="link.name"
          :href="link.href"
          target="_blank"
          rel="noopener"
          class="ml-2"
        >
          <font-awesome-icon
            :icon="`fa-${link.name} fa-brands`"
            class="w-7 h-7"
          />
        </a>
      </div>
    </nav>
    <aside>
      <p class="text-xs">
        The Pythagorean perpetual futures website (“Site”) is for informational
        and educational purposes only. The Site displays the existing perpetual
        futures deployed on the Obyte DAG and is a graphical user interface for
        both visualizing data from on-chain activity and interacting with
        autonomous agents directly from your own wallets. The Site and its
        developers take no custody of users' crypto assets and do not trade. The
        Site makes best effort to ensure accuracy of the displayed information
        however there are no guarantees of accuracy and the information is
        provided as is. None of the material on the Site is intended to be, nor
        does it constitute, a solicitation, recommendation or offer to buy or
        sell any security, commodity, interest, derivative, financial product or
        instrument. Users are responsible for complying with all applicable laws
        and should conduct their own analysis and consult with professional
        advisors prior to engaging with any futures markets.
      </p>
    </aside>
    <aside>
      <p class="text-sm">
        <a href="https://obyte.org" target="_blank" rel="noopener">Built on Obyte</a>
      </p>
    </aside>
  </footer>
</template>

<style scoped></style>
