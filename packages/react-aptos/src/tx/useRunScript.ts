import type { UserTransaction } from "@aptosis/aptos-common";
import { StructTag } from "@movingco/core";
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

export interface RunScriptArgs extends TXSendOptions {
  /**
   * Title of the transaction.
   */
  title?: string;
  params: SendParams;
  options?: SignAndSendTransactionParams["options"];
}

export const useRunScript = (): UseMutationResult<
  UserTransaction<"script_function_payload">,
  TXPrepareError | TXRevertError,
  RunScriptArgs
> => {
  const { onTXRequest, onTXSend, onTXPrepareError, onTXRevertError } =
    useAptosEventHandlers();
  const sendTransaction = useSendTransaction();
  const { mutateAsync: confirmTransaction } = useConfirmTX();
  const onSuccess = useHandleTXSuccess();

  const doRunScript = useCallback(
    async ({
      title,
      params,
      options = {},
      ...sendOptions
    }: RunScriptArgs): Promise<UserTransaction<"script_function_payload">> => {
      const {
        type_arguments = [],
        ["arguments"]: args = [],
        ["function"]: fn,
      } = params;

      if (!title) {
        const fnNameParts = StructTag.parse(fn);
        title = `${fnNameParts.module.identifier}::${fnNameParts.name}`;
      }

      const txWrapped = new AptosTransaction(title, params);
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
            return tx.confirmed as UserTransaction<"script_function_payload">;
          } else {
            throw new TXRevertError(tx.confirmed);
          }
        }

        // handle confirmation
        const result = await confirmTransaction(tx.result.hash);
        txWrapped.handleSuccess(result);
        return result as UserTransaction<"script_function_payload">;
      } catch (err) {
        if (err instanceof TXRevertError) {
          txWrapped.handleError(err);
          onTXRevertError?.(err);
        }
        const error = new TXPrepareError(params, err);
        txWrapped.handleError(error);
        onTXPrepareError?.(error);
        throw error;
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
