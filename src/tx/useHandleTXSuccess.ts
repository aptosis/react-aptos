import type { UserTransaction } from "@movingco/aptos-api";
import { useCallback } from "react";
import { useQueryClient } from "react-query";

import { useAptosAPI } from "../hooks.js";
import { applyWriteSetChangesToCache } from "../query/cache.js";

export const useHandleTXSuccess = () => {
  const client = useQueryClient();
  const aptosAPI = useAptosAPI();
  return useCallback(
    (data: UserTransaction) => {
      // the data is in the response, so updates should be relatively
      // easier to display
      applyWriteSetChangesToCache(aptosAPI.nodeUrl, client, data.changes);
    },
    [aptosAPI.nodeUrl, client]
  );
};
