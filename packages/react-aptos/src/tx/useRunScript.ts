import type { UserTransaction } from "@aptosis/aptos-common";
import type {
  SignAndSendTransactionParams,
  TXSendOptions,
} from "@omnimask/provider-interface";
import { useCallback } from "react";
import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { useAptosEventHandlers, useHandleTXSuccess } from "../index.js";
import { useSendTransaction } from "../omni/useSendTransaction.js";
import { AptosTransaction } from "./tx.js";
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
      ...sendOptions
    }: {
      params: SendParams;
      options?: SignAndSendTransactionParams["options"];
    } & TXSendOptions) => {
      const {
        type_arguments = [],
        ["arguments"]: args = [],
        ["function"]: fn,
      } = params;
      const txWrapped = new AptosTransaction(params);
      try {
        onTXRequest?.(txWrapped);
        const tx = await sendTransaction({
          payload: {
            type: "script_function_payload",
            type_arguments,
            arguments: args,
            function: fn,
          },
          options,
          ...sendOptions,
        });
        onTXSend?.(tx);
        txWrapped.handleSend(tx);
        if (tx.confirmed) {
          if (tx.confirmed.success) {
            onSuccess(tx.confirmed);
            txWrapped.handleSuccess(tx.confirmed);
            return tx.confirmed;
          } else {
            throw new TXRevertError(tx.confirmed);
          }
        }

        // handle confirmation
        const result = await confirmTransaction(tx.result.hash);
        txWrapped.handleSuccess(result);
        return result;
      } catch (err) {
        if (err instanceof TXRevertError) {
          txWrapped.handleError(err);
          onTXRevertError?.(err);
        } else {
          const error = new TXPrepareError(params, err);
          txWrapped.handleError(error);
          onTXPrepareError?.(error);
          throw error;
        }
        throw err;
      }
    },
    [
      confirmTransaction,
      onSuccess,
      onTXPrepareError,
      onTXRequest,
      onTXRevertError,
      onTXSend,
      sendTransaction,
    ]
  );

  return useMutation(doRunScript);
};
