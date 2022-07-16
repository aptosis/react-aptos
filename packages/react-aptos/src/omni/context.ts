import type { UserTransaction } from "@aptosis/aptos-api";
import { confirmTransaction } from "@aptosis/aptos-client";
import { useAptosAPI } from "@aptosis/seacliff";
import type {
  OmniProvider,
  ProviderState,
  RequestFaucetParams,
  RequestFaucetResult,
} from "@omnimask/provider-interface";
import { OmniRPC } from "@omnimask/provider-interface";
import { startTransition, useCallback, useEffect } from "react";
import type { QueryObserverResult } from "react-query";
import { useQuery } from "react-query";
import { default as invariant } from "tiny-invariant";
import { createContainer } from "unstated-next";

import { useHandleTXSuccess } from "../tx/useHandleTXSuccess.js";
import { useOmniProviderInternal } from "./useOmniProvider.js";

export const ensureProvider: (
  provider: OmniProvider | null | undefined
) => asserts provider = (provider: OmniProvider | null | undefined) => {
  if (!provider) {
    throw new Error("Provider not connected");
  }
};

const useOmniInner = (): OmniContext => {
  const provider = useOmniProviderInternal();
  const { data: wallet, refetch: reloadWallet } = useQuery(
    ["omnimask/providerState"],
    async () => {
      invariant(provider);
      return await provider.request({
        method: OmniRPC.GetProviderState,
      });
    },
    {
      enabled: !!provider,
      refetchOnWindowFocus: true,
    }
  );

  useEffect(() => {
    if (!provider) {
      return;
    }
    const reload = () => {
      void reloadWallet();
    };
    provider.events.on("connect", reload);
    provider.events.on("disconnect", reload);
    provider.events.on("accountsChanged", reload);
    provider.events.on("networkChanged", reload);
    provider.events.on("unlockStateChanged", reload);
    return () => {
      provider.events.removeListener("connect", reload);
      provider.events.removeListener("disconnect", reload);
      provider.events.removeListener("accountsChanged", reload);
      provider.events.removeListener("networkChanged", reload);
      provider.events.removeListener("unlockStateChanged", reload);
    };
  }, [provider, reloadWallet]);

  const handleTXSuccess = useHandleTXSuccess();

  const aptos = useAptosAPI();

  const requestFaucet = useCallback(
    async (params: RequestFaucetParams): Promise<RequestFaucetResult> => {
      ensureProvider(provider);
      const result = await provider.request({
        method: OmniRPC.RequestFaucet,
        params,
      });
      await Promise.all(
        result.txs.map(async (tx) => {
          const result = await confirmTransaction(aptos, tx);
          handleTXSuccess(result as UserTransaction);
        })
      );
      return result;
    },
    [aptos, handleTXSuccess, provider]
  );

  const connectWallet = useCallback(async (): Promise<void> => {
    ensureProvider(provider);
    await provider.request({
      method: OmniRPC.ConnectWallet,
    });
  }, [provider]);

  const disconnect = useCallback(async (): Promise<void> => {
    ensureProvider(provider);
    await provider.request({
      method: OmniRPC.DisconnectWallet,
    });
    startTransition(() => {
      void reloadWallet();
    });
  }, [provider, reloadWallet]);

  return {
    reloadWallet,
    provider,
    requestFaucet,
    connectWallet,
    disconnect,
    wallet,
  };
};

export interface OmniContext {
  reloadWallet: () => Promise<
    QueryObserverResult<ProviderState | null, unknown>
  >;
  provider?: OmniProvider | null;

  requestFaucet: (params: RequestFaucetParams) => Promise<RequestFaucetResult>;
  connectWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  wallet?: ProviderState | null;
}

export const { useContainer: useOmni, Provider: ReactOmniProvider } =
  createContainer(useOmniInner);
