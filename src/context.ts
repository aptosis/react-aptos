import { createAptosClient, TEST_COIN } from "@movingco/aptos";
import type { Coin } from "@movingco/core";
import type { AptosClient } from "aptos";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

import type { NetworkConfig } from "./aptos.js";
import { APTOS_DEVNET, AptosAPI } from "./aptos.js";
import type { OmniContext } from "./omni/context.js";
import { useOmniProviderInternal } from "./omni/context.js";

/**
 * Arguments for the Aptos client.
 */
export interface UseAptosArgs {
  /**
   * A map of coin addresses to coins on this network.
   */
  coins?: Record<string, Coin>;
  /**
   * Current network configuration.
   */
  network?: NetworkConfig;
}

export interface AptosContext extends OmniContext, Required<UseAptosArgs> {
  aptos: AptosClient;
  aptosAPI: AptosAPI;
}

const useAptosInner = ({
  coins = {
    [TEST_COIN.address]: TEST_COIN,
  },
  network = APTOS_DEVNET,
}: UseAptosArgs = {}) => {
  const omni = useOmniProviderInternal();

  const aptos = useMemo(
    () => createAptosClient(network.nodeUrl),
    [network.nodeUrl]
  );
  const aptosAPI = useMemo(
    () => new AptosAPI(network.nodeUrl),
    [network.nodeUrl]
  );

  return { ...omni, aptos, aptosAPI, coins };
};

export const { useContainer: useAptos, Provider: AptosProvider } =
  createContainer(useAptosInner);
