import type { Address } from "@aptosis/aptos-api";
import type { AccountResource } from "@aptosis/aptos-common";
import { ZERO_TEST_COINS } from "@aptosis/aptos-common";
import { aptos_framework_coin } from "@aptosis/aptos-framework";
import { ChainId, Coin, CoinAmount, mapN, StructTag } from "@movingco/core";
import type { Tuple } from "@saberhq/tuple-utils";
import { tupleFill, tupleMapInner } from "@saberhq/tuple-utils";
import { useCallback, useMemo } from "react";
import { default as invariant } from "tiny-invariant";

import { useSeacliff } from "./context.js";
import { useAllResources } from "./useResource.js";

export const useBalances = (
  owner?: Address | null | undefined
): CoinAmount[] | null | undefined => {
  const { coins } = useSeacliff();
  const { data: resources } = useAllResources(owner);

  const parseCoinStore = useCallback(
    ({ type, data }: AccountResource<aptos_framework_coin.ICoinStore>) => {
      const parsedType = StructTag.parse(type);
      const theType = parsedType.typeParams?.[0];
      invariant(theType);
      const fmt = theType.format();
      return new CoinAmount(
        coins[fmt] ?? Coin.fromParsedType(ChainId.AptosDevnet, theType),
        data.coin.value
      );
    },
    [coins]
  );

  return useMemo(() => {
    if (resources === null) {
      return [ZERO_TEST_COINS];
    }
    return mapN((resources) => {
      const amounts = resources
        .filter((r): r is AccountResource<aptos_framework_coin.ICoinStore> =>
          r.type.startsWith(aptos_framework_coin.structs.CoinStore)
        )
        .map(parseCoinStore)
        .filter((x): x is CoinAmount => !!x);
      if (amounts.length === 0) {
        return [ZERO_TEST_COINS];
      }
      return amounts;
    }, resources);
  }, [parseCoinStore, resources]);
};

export const useCoinBalance = <N extends number>(
  owner: Address | null | undefined,
  ...tokens: Tuple<Coin | null | undefined, N>
): Tuple<CoinAmount | null | undefined, N> => {
  const balances = useBalances(owner);
  return useMemo(() => {
    if (!balances) {
      return tupleFill(balances, tokens);
    }
    return tupleMapInner(
      (tok) => balances.find((b) => b.coin.equals(tok)) ?? null,
      tokens
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, ...tokens, balances]);
};
