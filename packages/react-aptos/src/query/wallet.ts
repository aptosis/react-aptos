/**
 * This file contains hooks which connect to the current wallet.
 */
import type { Coin, CoinAmount } from "@movingco/core";
import type { Tuple } from "@saberhq/tuple-utils";

import { useBalances, useCoinBalance } from "../index.js";
import { useOmni } from "../omni/context.js";
import { useAllResources } from "./useResource.js";

/**
 * Fetches all of the connected wallet's resources.
 * @returns
 */
export const useAllWalletResources = () => {
  const { wallet } = useOmni();
  return useAllResources(wallet?.selectedAccount);
};

/**
 * Fetches all of the connected wallet's coin balances.
 * @returns
 */
export const useWalletBalances = (): CoinAmount[] | null | undefined => {
  const owner = useOmni().wallet?.selectedAccount;
  return useBalances(owner);
};

/**
 * Fetches specific coin balances for the connected wallet.
 * @param coins
 * @returns
 */
export const useWalletBalance = <N extends number>(
  ...coins: Tuple<Coin | null | undefined, N>
): Tuple<CoinAmount | null | undefined, N> => {
  const owner = useOmni().wallet?.selectedAccount;
  return useCoinBalance(owner, ...coins);
};
