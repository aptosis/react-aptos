import type { UserTransaction } from "@aptosis/aptos-api";
import { useApplyUserTransactionToCache } from "@aptosis/seacliff";
import { useCallback } from "react";

import { useAptosEventHandlers } from "../events.js";

export const useHandleTXSuccess = (): ((data: UserTransaction) => void) => {
  const { onTXSuccess } = useAptosEventHandlers();
  const applyUserTransactionToCache = useApplyUserTransactionToCache();
  return useCallback(
    (data: UserTransaction) => {
      onTXSuccess?.(data);
      // the data is in the response, so updates should be relatively
      // easier to display
      applyUserTransactionToCache(data);
    },
    [applyUserTransactionToCache, onTXSuccess]
  );
};
