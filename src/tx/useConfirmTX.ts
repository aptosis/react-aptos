import { confirmTransaction } from "@movingco/aptos";
import type { UserTransaction } from "@movingco/aptos-api";
import { useMutation } from "react-query";

import { useAptosClient } from "../provider.js";
import { FailedTXError } from "./txHelpers.js";
import { useHandleTXSuccess } from "./useHandleTXSuccess.js";

export const useConfirmTX = () => {
  const aptos = useAptosClient();
  const onSuccess = useHandleTXSuccess();
  return useMutation(
    async (txHash: string) => {
      const txResult = (await confirmTransaction(
        aptos,
        txHash
      )) as UserTransaction;

      if (!txResult.success) {
        throw new FailedTXError(txResult);
      }
      return txResult;
    },
    {
      onSuccess: (data) => {
        // notify({
        //   message: `Transaction confirmed`,
        //   description: data.vm_status,
        // });
        onSuccess(data);
      },
      onError: (err) => {
        if (err instanceof FailedTXError) {
          //   notify({
          //     message: `Transaction failed`,
          //     type: "error",
          //     description: err.result.vm_status,
          //   });
        }
      },
    }
  );
};
