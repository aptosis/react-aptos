import { TEST_COIN } from "@movingco/aptos";
import type { Coin } from "@movingco/core";
import { createContainer } from "unstated-next";

import type { OmniContext } from "./omni/context.js";
import { useOmniProviderInternal } from "./omni/context.js";

interface UseAptosArgs {
  coins?: Record<string, Coin>;
}

export interface AptosContext extends OmniContext {
  coins: Record<string, Coin>;
}

const useAptosInner = ({
  coins = {
    [TEST_COIN.address]: TEST_COIN,
  },
}: UseAptosArgs = {}) => {
  const omni = useOmniProviderInternal();
  return { ...omni, coins };
};

export const { useContainer: useAptos, Provider: AptosProvider } =
  createContainer(useAptosInner);
