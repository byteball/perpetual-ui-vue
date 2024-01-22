<script setup>
import FormulaComponent from "@/components/FormulaComponent.vue";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

function scrollTo(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
  router.replace({ hash: `#${id}` });
}

onMounted(() => {
  if (location.hash) {
    setTimeout(() => {
      scrollTo(location.hash.slice(1));
    }, 1000);
  }
});
</script>

<template>
  <div class="container w-full sm:w-[768px] m-auto mt-2 p-6 sm:p-8">
    <div class="p-2 mb-6">
      <h1 class="text-2xl font-bold leading-8">Frequently asked questions</h1>
    </div>

    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">What are Pythagorean futures?</h2>
      <div>
        Pythagorean futures are
        <a @click.prevent="scrollTo('perp_futures')" href="#perp_futures"
          >perpetual futures</a
        >
        issued on
        <a
          @click.prevent="scrollTo('pythagorean_bonding_curves')"
          href="#pythagorean_bonding_curves"
          >Pythagorean bonding curves</a
        >.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4" id="perp_futures">
        What are perpetual futures?
      </h2>
      <div>
        Perpetual futures follow the price of an asset, such as a commodity,
        stock, or cryptocurrency. They allow traders to take positions in such
        assets and profit from their price changes without actually holding
        them. Unlike regular futures, perpetual futures never expire.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4" id="pythagorean_bonding_curves">
        What are Pythagorean bonding curves?
      </h2>
      <div>
        Pythagorean bonding curves are bonding curves described by formulas
        like:
      </div>
      <FormulaComponent
        formula="$$r = c \: \sqrt{a_0 \: {s_0}^2\: +\: a_1 \: {s_1}^2 + a_2 \: {s_2}^2\: +\: ...}$$"
      />
      <div>
        where:
        <ul>
          <li>
            <FormulaComponent formula="$r$" :inline="true" /> is the total
            reserve committed to issuing the futures tokens;
          </li>
          <li>
            <FormulaComponent formula="$s_0,\: s_1,\: s_2$" :inline="true" />,
            ... are the supplies of the futures tokens;
          </li>
          <li>
            <FormulaComponent formula="$a_0,\: a_1,\: a_2$" :inline="true" />,
            ... are some coefficients corresponding to the respective tokens;
          </li>
          <li>
            <FormulaComponent formula="$c$" :inline="true" /> is another
            coefficient.
          </li>
        </ul>
      </div>
      <div>
        The formula resembles the well-known Pythagorean theorem, which gives
        such curves the name.
      </div>
      <div>
        In general, bonding curves are mathematical formulas that link the total
        amount of the input (reserve) currency used to issue new tokens, with
        the total amounts of the issued tokens. The above formula is just one
        type of bonding curve, however infinitely more curves are possible. We
        used another family of bonding curves in our
        <a
          href="https://blog.obyte.org/using-multi-dimensional-bonding-curves-to-create-stablecoins-81e857b4355c"
          target="_blank"
          rel="noopener"
          >bonded stablecoins</a
        >, we used yet another curve for
        <a
          href="https://blog.obyte.org/oswap-token-d670357fdf0e"
          target="_blank"
          rel="noopener"
          >OSWAP token</a
        >, and we used similar Pythagorean bonding curves for
        <a
          href="https://blog.obyte.org/introducing-prophet-prediction-markets-based-on-bonding-curves-3716651db344"
          target="_blank"
          rel="noopener"
          >Prophet prediction markets</a
        >.
      </div>
      <div>
        A bonding curve determines how much reserve currency should be paid in
        order to issue a given amount of any token. For example, if we want to
        issue more of the 1st token, i.e. increase its supply
        <FormulaComponent formula="$s_1$" :inline="true" />, we need to
        calculate the right-hand side of the above formula with the new
        (increased) <FormulaComponent formula="$s_1$" :inline="true" /> to learn
        the new required reserve. Its difference from the previous amount of
        reserve shows how much additional reserve should be paid to issue the
        tokens.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">
        What makes the futures follow the benchmark price?
      </h2>
      <div>
        Pythagorean futures follow the price of the currency/stock/commodity
        they are tracking, and they do so by adjusting the parameters
        <FormulaComponent formula="$a_0,\: a_1,\: a_2$" :inline="true" />, ...
        and <FormulaComponent formula="$c$" :inline="true" /> of the bonding
        curve.
      </div>
      <p>
        From the bonding curve formula above, the price of the token 1 in terms
        of the reserve currency would be the partial derivative of
        <FormulaComponent formula="$r$" :inline="true" /> by
        <FormulaComponent formula="$s_1$" :inline="true" />:
      </p>
      <FormulaComponent
        formula="$$p_1 = {c \: a_1 \: s_1 \over \sqrt{a_0 \: {s_0}^2\: +\: a_1 \: {s_1}^2 + a_2 \: {s_2}^2\: +\: ...}}$$"
      />
      <p>
        If the price differs from the target price (reported by an oracle), the
        parameters <FormulaComponent formula="$a_1$" :inline="true" /> and
        <FormulaComponent formula="$c$" :inline="true" /> would gradually change
        such that the <FormulaComponent formula="$p_1$" :inline="true" /> comes
        closer to the target. It would completely correct to the target price
        within a predetermined period of time (which can be changed by
        <RouterLink :to="`/governance`">governance</RouterLink>) such as 3 days.
        This change of the parameters moves us to a slightly different bonding
        curve. It also affects (to a smaller extent) the prices of all other
        tokens, so they move closer or farther from their targets and might
        require smaller or larger correction themselves.
      </p>
      <p>
        However, even before such an adjustment happens, traders can try to
        profit from the expected adjustment by buying (anticipating upwards
        adjustment) or selling (anticipating downwards adjustment) the token
        before the actual adjustment, and selling back or buying back
        respectively after the adjustment. These trades would move the price
        closer to the target.
      </p>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">Are perpetual futures stablecoins?</h2>
      <div>
        Yes. Like stablecoins, they are tokens that attempt to follow the price
        of some asset, such as a stock, a commodity, a fiat currency, or another
        cryptocurrency.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">What is the reserve?</h2>
      <div>
        The reserve is an asset used to issue new Pythagorean futures. Users
        send the reserve asset and receive newly issued futures tokens in
        exchange. They can also redeem the futures tokens and get the reserve
        asset back. The reserve is locked on an
        <a
          href="https://obyte.org/platform/autonomous-agents"
          target="_blank"
          rel="noopener"
          >autonomous agent</a
        >
        (AA) that is responsible for issuing/redeeming the futures tokens and
        adjusting their prices. When redeeming (selling to the AA) a futures
        token, the redeemed tokens are destroyed and some amount of the reserve
        asset is released to the seller.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">What can be the reserve asset?</h2>
      <div>
        When a new futures set is created (anyone can do it
        <RouterLink :to="`/create`">here</RouterLink>), any token can be chosen
        as the reserve asset.
      </div>
      <div>
        One interesting use case is using an
        <a href="https://oswap.io" target="_blank" rel="noopener">Oswap</a> pool
        token, such as
        <a
          href="https://oswap.io/#/add-liquidity/MBTF5GG44S3ARJHIZH3DEAB4DGUCHCF6"
          target="_blank"
          rel="noopener"
          >O-GBYTE-USDC</a
        >, as reserve asset, then issuing futures assets pegged to the pool's
        constituent tokens, such as GBYTE and USDC. Thus, the pool token holders
        would be able to gain exposure to their preferred asset in the pool.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">What is a futures set?</h2>
      <div>
        A futures set is a set of futures issued by a single AA. They all share
        the same reserve asset, a common reserve, the same parameters (such as
        trading fees), and the same governance token.
      </div>
      <div>
        When any token in a futures set is traded, the prices of all other
        tokens in the set are affected. When a token's price is adjusted (to
        bring it closer to the target price), the prices of all other tokens in
        the set are also affected. Different futures sets (and their tokens) are
        completely independent of each other.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">
        What is the governance token of a futures set?
      </h2>
      <div>
        Every futures set has a governance token. In the formulas above, it is
        the 0th asset, and its supply is
        <FormulaComponent formula="$s_0$" :inline="true" />. It is not pegged to
        any price unlike all other (1st, 2nd, 3rd, and so on) tokens in the set.
      </div>
      <div>
        Holders of the governance asset earn from fees generated from all
        trading in the set. The earnings are automatically reflected in the
        price of the governance token &mdash; by adjusting the parameters
        <FormulaComponent formula="$a_0$" :inline="true" /> and
        <FormulaComponent formula="$c$" :inline="true" /> after each trade.
        Those holders who also stake (lock) their governance tokens to
        participate in governance earn a bigger share of the fees. Longer
        locking periods yield a larger share of the fees.
      </div>
      <div>
        However, holders of the governance token bear the risks of the price of
        their token going down in case the prices of some futures tokens in the
        set grow too fast and have to be adjusted at the expense of all other
        tokens, including the governance token.
      </div>
      <div>
        Holders of the governance token can participate in
        <RouterLink :to="`/governance`">governance</RouterLink>
        of the set by locking their tokens for a certain time and voting about
        changing the set's parameters and adding new futures tokens. In exchange
        for participation in governance, they earn a bigger share of the trading
        fees.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">How are the futures sets governed?</h2>
      <div>
        Anyone can participate in
        <RouterLink :to="`/governance`">governance</RouterLink>
        by buying the governance tokens and
        <RouterLink :to="`/stake`">locking (staking)</RouterLink>
        them for a certain period from 14 days to 1 year. Longer locking periods
        yield more voting power (VP) &mdash; weight in the future votes. After
        being locked, the VP starts decaying exponentially such that it decays 8
        times within a year. To refresh it, one needs to extend the locking
        period. This behavior of VP is similar to VP in
        <a href="https://token.oswap.io/faq" target="_blank" rel="noopener"
          >OSWAP token governance</a
        >.
      </div>
      <div>
        Governance participants receive a portion (50% by default) of all
        trading fees, and these earnings are distributed among them in
        proportion to their VP. So, those who have more skin in the game by
        locking more tokens for longer terms, get a larger share of the fees.
      </div>
      <div>
        Governance gets to decide the parameters of their futures set, such as
        trading fees. It also votes about adding new futures tokens and can
        later change their parameters, for example, introduce an oracle used to
        obtain the target price.
      </div>
      <div>
        Every futures set has its own governance independent of all other
        futures sets.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">Why stake governance tokens?</h2>
      <div>
        To get a portion of the trading fees and participate in
        <RouterLink :to="`/governance`">governance</RouterLink>.
      </div>
      <div>
        A portion of the trading fees (by default, 50%) goes to stakers and is
        distributed among them in proportion to their VP. If a relatively small
        share of the governance tokens is staked, this means that 50% (by
        default) of all fees would be distributed among a small number of
        stakers.
      </div>
      <div>
        Among stakers, the earnings are distributed in proportion to their VP,
        meaning that longer locking term yields more earnings (it also yields
        more weight in governance decisions).
      </div>
      <div>
        The accumulated fees can be withdrawn at any time at
        <RouterLink :to="`/governance`">governance</RouterLink> or
        <RouterLink :to="`/stake`">staking</RouterLink> pages.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">Who can create a new futures set?</h2>
      <div>
        Anyone can
        <RouterLink :to="`/create`">create a new futures set</RouterLink>.
      </div>
      <div>
        The most important parameters of a futures set are its reserve asset and
        trading fee. The trading fee and some other parameters can be later
        changed by
        <RouterLink :to="`/governance`">governance</RouterLink>.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">Who can create a new futures token?</h2>
      <div>
        Anyone who has locked the governance tokens of a futures set can suggest
        adding a new futures token into that set. This function is available on
        the
        <RouterLink :to="`/governance`">governance page</RouterLink>
        of the said futures set. The most important parameter of the new futures
        token is its price oracle that will be used to obtain the target price
        of the new token.
      </div>
      <div>
        After it is proposed, other governance participants have a chance to
        vote either for or against adding the proposed futures token. The weight
        of their votes is determined by their VP which depends on the locked
        balance in the governance token and the remaining locking period.
      </div>
      <div>
        If approved, the new token first becomes available on a presale, then it
        starts trading like any other futures token.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">What is a presale?</h2>
      <div>
        Any newly launched futures token becomes first available on a presale.
        On the presale, it is sold at the oracle price. Those who want to buy,
        contribute the reserve assets, and when the presale ends they are
        allocated new tokens at the oracle price on the date of the presale
        completion. All participants get the tokens at the same price. The
        allocated tokens have then to be claimed.
      </div>
      <div>
        The presale ends when either its term expires (14 days by default but it
        can be changed by
        <RouterLink :to="`/governance`">governance</RouterLink>) or the amount
        of the reserve currency committed to buying the new token exceeds some
        share (10% by default but can be changed by governance) of the current
        reserve of the set. The latter condition is to avoid domination of a
        single token in the set.
      </div>
      <div>
        After the presale ends, normal trading starts and the token's price can
        change as a result of trading.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">What are the fees?</h2>
      <p>
        The fees vary among futures sets and are determined by the set's
        creators and their
        <RouterLink :to="`/governance`">governance</RouterLink>. The default
        trading fee is 0.3%.
      </p>
      <p>
        There is also an additional fee called
        <i>arbitrageur profit tax</i> which is proportional to the price change
        caused by the trade. When our markets are arbitraged against similar
        markets on other platforms, this tax helps to collect most of the
        arbitrageur profit in favor of the governance token holders. The default
        arb profit tax is 90%.
      </p>
      <p>
        All the collected fees benefit the governance token holders. A part of
        them (50% by default) is reflected in the increase of their token's
        price, while the other part is distributed among those governance token
        holders who stake (lock) their tokens for some time to participate in
        governance.
      </p>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">
        What ensures the liquidity of the futures tokens?
      </h2>
      <p>
        The bonding curve. Thanks to the bonding curve, it is always possible to
        buy and sell the futures tokens.
      </p>
      <p>
        Like on any market, buying increases the token's price and selling
        decreases it. This can pull the token's price away from the target price
        or push it towards the target price. Larger futures sets provide a
        smaller price impact of buys/sells.
      </p>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">
        How are the Pythagorean futures different from bonded stablecoins?
      </h2>
      <div>
        Both Pythagorean perpetual futures and
        <a
          href="https://blog.obyte.org/using-multi-dimensional-bonding-curves-to-create-stablecoins-81e857b4355c"
          target="_blank"
          rel="noopener"
          >bonded stablecoins</a
        >
        are issued on bonding curves.
      </div>
      <div>
        However, the curves used in bonded stablecoins had the total value of
        the issued assets greater than the locked reserve, which was supposed to
        attract interest of traders but in practice led to wild speculative
        movements and depegged many stablecoins. In contrast, Pythagorean
        bonding curves are zero-sum, meaning that the total value of all issued
        tokens is equal to the locked reserve. We believe there are no
        destabilizing incentives in the Pythagorean futures and expect them to
        closely follow the benchmark prices.
      </div>
      <div>
        Also, the mechanisms returning the price to the target are different. In
        bonded stablecoins, the growing fee disincentivized trades that pushed
        the price further from the target, which meant that when the price was
        far enough below the target, it was impossible to sell the stablecoins.
        In Pythagorean futures, there are no prohibitive fees, and it is always
        possible to sell them, even when the price is far below the benchmark.
        The price tracking mechanism redistributes the value among tokens trying
        to get the price closer to the target.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">
        How are Pythagorean futures different from other perpetual futures?
      </h2>
      <div>
        Unlike traditional perpetual futures (traded on BitMEX, Binance futures,
        Deribit, etc), a trader's position in Pythagorean futures can never be
        liquidated. A trader just holds the tokens and no matter how the price
        changes there is no way for the trader's capital to become insufficient
        and be liquidated. There is also no systemic risk that liquidations fail
        due to too fast movement of a price and the system becomes insolvent.
      </div>
      <div>
        Pythagorean futures also do not allow trading with leverage (unless the
        target price is set up to follow some synthetic leveraged price, but the
        <RouterLink :to="`/governance`">governance</RouterLink>
        might not approve such a volatile token to be launched).
      </div>
      <div>
        Also, the Pythagorean futures are just normal tokens and can be freely
        used in other DeFi apps, which ensures better composability.
      </div>
      <div>
        The mechanisms that correct the price to the target are somewhat similar
        but not the same. In traditional perpetual futures, longs pay shorts or
        shorts pay longs depending on the direction of the price deviation. This
        doesn't affect the price directly but provides incentives for its
        correction to the target. In Pythagorean futures, the bonding curve
        gradually morphs to redistribute value from overpriced futures to
        underpriced ones and to correct the price at the same time.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">
        Is it possible that a futures price deviates from its target?
      </h2>
      <div>
        Yes, it is possible. The price adjustment mechanism will correct the
        price towards the target in this case. Anticipating this correction,
        traders might find it profitable to buy or sell the token thus
        accelerating the price correction. However, these mechanisms might not
        be sufficient, e.g. if the target price grows too fast and/or the
        reserve price falls too fast. In such cases, the futures tokens might
        depeg for a long time.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">How can a depeg be prevented?</h2>
      <div>
        The probability of a depeg can be reduced with prudent governance. In
        particular, governance should avoid adding too volatile futures whose
        price can grow too fast. The governance should also try to make sure
        that every futures token comprises a relatively small share of the total
        reserve and keep many different futures in the set so that their price
        movements cancel each other. It is also preferred to have the set
        dominated by the futures tokens whose price is correlated with the price
        of the reserve asset.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">What are the risks?</h2>
      <div>
        <ul>
          <li>Bugs in autonomous agents.</li>
          <li>
            Depeg, as described above. The risks can be mitigated as described
            above.
          </li>
          <li>
            Oracle failure. It can report the wrong price or stop reporting
            price updates.
          </li>
          <li>
            Malicious governance decisions. However, the scope of such decisions
            is limited: for example, governance cannot change the oracle of a
            futures token after it was launched. Also, the risks are mitigated
            by the requirement of long-term locking of the governance token in
            order to obtain voting power. Since any malicious governance
            decision would likely make users exit the set and stop income from
            trading fees, it would leave the governors in an unfavorable
            position as their funds would stay locked for a significant time.
          </li>
        </ul>
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">What are the sources of price data?</h2>
      <div>
        Oracles provide the data about the prices of the benchmark assets
        (stocks, currencies, commodities, etc) that the futures are following.
        Each futures token has its own price oracle and traders can assess their
        reliability before buying the tokens. To prevent the risk of rug pull,
        oracles cannot be changed by governance.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">How to make money in Pyth?</h2>
      <div>
        <b>Trading perpetual futures.</b> If you want to bet on the price of a
        particular asset going higher, you can buy the corresponding futures
        token now and sell it later after its price grows. Risks: a futures
        token might lose its peg (see above).
      </div>
      <div>
        <b>Arbitrage.</b> If you see that the price of a particular futures
        token deviates from its target (the price of the asset it is tracking),
        you can take advantage of the Pyth's price correction mechanism. For
        example, if the futures price is below the target, you can buy the
        futures tokens now, wait for the price to correct to the target
        (higher), then sell the tokens at the higher price. To avoid exposure to
        the asset, you can simultaneously short the underlying asset on other
        markets. Risks: a futures token might lose its peg (see above) and the
        price never corrects.
      </div>
      <div>
        <b>Trading fees.</b> Buy the governance tokens of a futures set and just
        hold them. Part of the collected trading fees goes to the governance
        token holders by increasing the price of their token after each trade.
        To earn more, stake these tokens in
        <RouterLink :to="`/governance`">governance</RouterLink> to get a share
        of the other part of the trading fees which goes to stakers. This part
        is distributed among stakers in proportion to their VP, so you gain more
        by locking your governance tokens for a longer term. Risks: 1)
        governance tokens are inherently volatile; 2) they might significantly
        depreciate if the price of one of the futures assets grows too fast
        relative to the price of the reserve asset.
      </div>
    </div>
    <div class="card bg-base-200 shadow-xl mb-4 p-6 sm:p-8">
      <h2 class="card-title mb-4">Who operates Pyth?</h2>
      <p>
        Nobody. Every futures set is operated by its own
        <a
          href="https://obyte.org/platform/autonomous-agents"
          target="_blank"
          rel="noopener"
          >Autonomous Agent</a
        >
        (AA) which is a piece of autonomous (as the name implies) immutable code
        running on
        <a href="https://obyte.org" target="_blank" rel="noopener">Obyte DAG</a>
        in a totally manless manner. Nobody can stop them, nobody can intervene
        with their operation, except their
        <RouterLink :to="`/governance`">governance</RouterLink>
        that has limited ability to tune the set's parameters. The code of the
        AAs, as well as all their activity, are fully transparent.
      </p>
      <p>
        Anyone can start a new futures set and it becomes immediately available
        to everyone.
      </p>
      <p>
        This website is open-source and anyone can start any number of copies of
        this website anywhere in the world by downloading its code from
        <a
          href="https://github.com/byteball/perpetual-ui-vue"
          target="_blank"
          rel="noopener"
          >github</a
        >.
      </p>
      <p>
        By engaging with this website, you are engaging with the Autonomous
        Agents the website offers an interface to, not with any companies,
        organizations, or individuals. There is no contract. You do not acquire
        any rights or obligations towards anyone, and nobody acquires any rights
        or obligations towards you.
      </p>
    </div>
  </div>
</template>

<style scoped>
a {
  @apply link link-hover text-sky-500;
}

p {
  @apply my-2;
}

.card > div {
  @apply my-2;
}

h2 {
  @apply mb-4;
}

ul {
  @apply ml-4 list-disc list-inside;
}
</style>
