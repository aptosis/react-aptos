import { confirmTransaction } from "@movingco/aptos";
import type { UserTransaction } from "@movingco/aptos-api";
import type {
  OmniProvider,
  ProviderState,
  RequestFaucetParams,
  RequestFaucetResult,
} from "@omnimask/provider-interface";
import { OmniRPC } from "@omnimask/provider-interface";
import type { AptosClient } from "aptos";
import { startTransition, useCallback, useEffect } from "react";
import type { QueryObserverResult } from "react-query";
import { useQuery } from "react-query";
import { default as invariant } from "tiny-invariant";

import { useHandleTXSuccess } from "../tx/useHandleTXSuccess.js";
import { useOmniProvider } from "./useOmniProvider.js";

export const ensureProvider: (
  provider: OmniProvider | null | undefined
) => asserts provider = (provider: OmniProvider | null | undefined) => {
  if (!provider) {
    throw new Error("Provider not connected");
  }
};

export const useOmniProviderInternal = ({
  aptos,
}: {
  aptos: AptosClient;
}): OmniContext => {
  const provider = useOmniProvider();
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
    provider.on("connect", reload);
    provider.on("disconnect", reload);
    provider.on("accountsChanged", reload);
    provider.on("networkChanged", reload);
    provider.on("unlockStateChanged", reload);
    return () => {
      provider.removeListener("connect", reload);
      provider.removeListener("disconnect", reload);
      provider.removeListener("accountsChanged", reload);
      provider.removeListener("networkChanged", reload);
      provider.removeListener("unlockStateChanged", reload);
    };
  }, [provider, reloadWallet]);

  const handleTXSuccess = useHandleTXSuccess();

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
  reloadWallet: () => Promise<QueryObserverResult<ProviderState, unknown>>;
  provider?: OmniProvider | null;

  requestFaucet: (params: RequestFaucetParams) => Promise<RequestFaucetResult>;
  connectWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  wallet?: ProviderState;
}
