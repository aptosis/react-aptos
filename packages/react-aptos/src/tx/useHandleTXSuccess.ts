import { useApplyWriteSetChangesToCache } from "@aptosis/seacliff";
import type { UserTransaction } from "@movingco/aptos-api";
import { useCallback } from "react";

export const useHandleTXSuccess = () => {
  const applyWriteSetChangesToCache = useApplyWriteSetChangesToCache();
  return useCallback(
    (data: UserTransaction) => {
      // the data is in the response, so updates should be relatively
      // easier to display
      applyWriteSetChangesToCache(data.changes);
    },
    [applyWriteSetChangesToCache]
  );
};
