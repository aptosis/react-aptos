import type { NetworkConfig } from "@movingco/aptos";
import {
  APTOS_DEVNET,
  AptosAPI,
  createAptosClient,
  TEST_COIN,
} from "@movingco/aptos";
import type { Coin } from "@movingco/core";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

import type { AptosEventHandlers } from "../index.js";

/**
 * Arguments for the Aptos client.
 */
export interface AptosConnectionConfig {
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
export type UseAptosConnectionArgs = Partial<AptosConnectionConfig> &
  AptosEventHandlers;

const useAptosConnectionInner = ({
  coins = {
    [TEST_COIN.address]: TEST_COIN,
  },
  network = APTOS_DEVNET,
  ...rest
}: UseAptosConnectionArgs = {}) => {
  const aptos = useMemo(
    () => createAptosClient(network.nodeUrl),
    [network.nodeUrl]
  );
  const aptosAPI = useMemo(
    () => new AptosAPI(network.nodeUrl),
    [network.nodeUrl]
  );

  return { aptos, aptosAPI, coins, ...rest };
};

export const {
  useContainer: useAptosConnection,
  Provider: AptosConnectionProvider,
} = createContainer(useAptosConnectionInner);
