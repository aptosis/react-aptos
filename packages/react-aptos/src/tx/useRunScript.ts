import type { UserTransaction } from "@aptosis/aptos-common";
import type { SignAndSendTransactionParams } from "@omnimask/provider-interface";
import { useCallback } from "react";
import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { useAptosEventHandlers, useHandleTXSuccess } from "../index.js";
import { useSendTransaction } from "../omni/useSendTransaction.js";
import type { SendParams } from "./txHelpers.js";
import { TXPrepareError, TXRevertError } from "./txHelpers.js";
import { useConfirmTX } from "./useConfirmTX.js";

export const useRunScript = (): UseMutationResult<
  UserTransaction,
  unknown,
  {
    params: SendParams;
    options?: SignAndSendTransactionParams["options"];
  },
  unknown
> => {
  const { onTXRequest, onTXSend, onTXPrepareError, onTXRevertError } =
    useAptosEventHandlers();
  const sendTransaction = useSendTransaction();
  const { mutateAsync: confirmTransaction } = useConfirmTX();
  const onSuccess = useHandleTXSuccess();

  const doRunScript = useCallback(
    async ({
      params,
      options = {},
    }: {
      params: SendParams;
      options?: SignAndSendTransactionParams["options"];
    }) => {
      const {
        type_arguments = [],
        ["arguments"]: args = [],
        ["function"]: fn,
      } = params;
      onTXRequest?.(params);
      const tx = await sendTransaction({
        payload: {
          type: "script_function_payload",
          type_arguments,
          arguments: args,
          function: fn,
        },
        options,
      });
      onTXSend?.(tx);
      if (tx.confirmed) {
        if (tx.confirmed.success) {
          onSuccess(tx.confirmed);
          return tx.confirmed;
        } else {
          throw new TXRevertError(tx.confirmed);
        }
      }
      return await confirmTransaction(tx.result.hash);
    },
    [confirmTransaction, onSuccess, onTXRequest, onTXSend, sendTransaction]
  );

  return useMutation(doRunScript, {
    onError: (e, { params }) => {
      if (e instanceof TXRevertError) {
        onTXRevertError?.(e);
      } else {
        const error = new TXPrepareError(params, e);
        onTXPrepareError?.(error);
        throw error;
      }
      throw e;
    },
  });
};
