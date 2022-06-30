import type { NetworkConfig } from "@movingco/aptos";
import {
  APTOS_DEVNET,
  AptosAPI,
  createAptosClient,
  TEST_COIN,
} from "@movingco/aptos";
import type { Coin } from "@movingco/core";
import type { AptosClient } from "aptos";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

import type { AptosEventHandlers } from "./events.js";
import type { OmniContext } from "./omni/context.js";
import { useOmniProviderInternal } from "./omni/context.js";

/**
 * Arguments for the Aptos client.
 */
export interface AptosProviderConfig {
  /**
   * A map of coin addresses to coins on this network.
   */
  coins: Record<string, Coin>;
  /**
   * Current network configuration.
   */
  network: NetworkConfig;
}

/**
 * Arguments for the Aptos client.
 */
export interface UseAptosArgs
  extends Partial<AptosProviderConfig>,
    AptosEventHandlers {}

export interface AptosContext extends OmniContext, AptosProviderConfig {
  aptos: AptosClient;
  aptosAPI: AptosAPI;
}

const useAptosInner = ({
  coins = {
    [TEST_COIN.address]: TEST_COIN,
  },
  network = APTOS_DEVNET,
  ...rest
}: UseAptosArgs = {}) => {
  const aptos = useMemo(
    () => createAptosClient(network.nodeUrl),
    [network.nodeUrl]
  );
  const aptosAPI = useMemo(
    () => new AptosAPI(network.nodeUrl),
    [network.nodeUrl]
  );

  const omni = useOmniProviderInternal({ aptos });

  return { ...omni, aptos, aptosAPI, coins, ...rest };
};

export const { useContainer: useAptos, Provider: AptosProvider } =
  createContainer(useAptosInner);
