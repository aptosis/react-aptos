import type { NetworkConfig } from "@aptosis/aptos-client";
import { APTOS_DEVNET, AptosAPI } from "@aptosis/aptos-client";
import { TEST_COIN } from "@aptosis/aptos-common";
import { createAptosClient } from "@movingco/aptos";
import type { Coin } from "@movingco/core";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

/**
 * Arguments for the Aptos client.
 */
export interface SeacliffConfig {
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
export type UseSeacliffArgs = Partial<SeacliffConfig>;

const useSeacliffInner = ({
  coins = {
    [TEST_COIN.address]: TEST_COIN,
  },
  network = APTOS_DEVNET,
  ...rest
}: UseSeacliffArgs = {}) => {
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

export const { useContainer: useSeacliff, Provider: SeacliffInternalProvider } =
  createContainer(useSeacliffInner);
