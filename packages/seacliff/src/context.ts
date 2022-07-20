import { TEST_COIN } from "@aptosis/aptos-common";
import type { Coin } from "@movingco/core";
import { createContainer } from "unstated-next";

/**
 * Arguments for the Aptos client.
 */
export interface SeacliffConfig {
  /**
   * A map of coin addresses to coins on this network.
   */
  coins: Record<string, Coin>;
}

/**
 * Arguments for the Aptos client.
 */
export type UseSeacliffArgs = Partial<SeacliffConfig>;

const useSeacliffInner = ({
  coins = {
    [TEST_COIN.address]: TEST_COIN,
  },
}: UseSeacliffArgs = {}) => {
  return { coins };
};

export const { useContainer: useSeacliff, Provider: SeacliffInternalProvider } =
  createContainer(useSeacliffInner);
