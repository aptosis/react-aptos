import type { NetworkConfig } from "@aptosis/aptos-client";
import { APTOS_DEVNET, AptosAPI } from "@aptosis/aptos-client";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

/**
 * Arguments for the Aptos API connection.
 */
export interface AptosAPIConfig {
  /**
   * Current network configuration.
   */
  readonly network: NetworkConfig;
}

/**
 * Arguments for the Aptos client.
 */
export type UseAptosAPIArgs = Partial<AptosAPIConfig>;

const useAptosAPIInner = ({
  network = APTOS_DEVNET,
}: UseAptosAPIArgs = {}): AptosAPI => {
  const aptosAPI = useMemo(
    () => new AptosAPI(network.nodeUrl),
    [network.nodeUrl]
  );
  return aptosAPI;
};

export const { useContainer: useAptosAPI, Provider: AptosAPIProvider } =
  createContainer(useAptosAPIInner);
