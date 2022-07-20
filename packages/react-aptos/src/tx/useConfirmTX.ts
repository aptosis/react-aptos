import type { UserTransaction } from "@aptosis/aptos-api";
import { confirmTransaction } from "@aptosis/aptos-client";
import { useAptosAPI } from "@aptosis/seacliff";
import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { useAptosEventHandlers } from "../events.js";
import { TXRevertError } from "./txHelpers.js";
import { useHandleTXSuccess } from "./useHandleTXSuccess.js";

export const useConfirmTX = (): UseMutationResult<
  UserTransaction,
  unknown,
  string
> => {
  const aptosAPI = useAptosAPI();
  const { onTXRevertError: onTXError } = useAptosEventHandlers();
  const onSuccess = useHandleTXSuccess();
  return useMutation(
    async (txHash: string) => {
      const txResult = (await confirmTransaction(
        aptosAPI,
        txHash
      )) as UserTransaction;
      if (!txResult.success) {
        throw new TXRevertError(txResult);
      }
      return txResult;
    },
    {
      onSuccess: (data) => {
        onSuccess(data);
      },
      onError: (err) => {
        if (err instanceof TXRevertError) {
          onTXError?.(err);
        }
      },
    }
  );
};
