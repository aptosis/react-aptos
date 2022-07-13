import type { UserTransaction } from "@aptosis/aptos-api";
import type { SignAndSendTransactionParams } from "@omnimask/provider-interface";
import { useCallback } from "react";
import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { useAptosEventHandlers } from "../index.js";
import { useSendTransaction } from "../omni/useSendTransaction.js";
import type { SendParams } from "./txHelpers.js";
import { TXPrepareError } from "./txHelpers.js";
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
  const { onTXRequest, onTXSend, onTXPrepareError } = useAptosEventHandlers();
  const sendTransaction = useSendTransaction();
  const confirmTransaction = useConfirmTX();

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
      return await confirmTransaction.mutateAsync(tx.result.hash);
    },
    [confirmTransaction, onTXRequest, onTXSend, sendTransaction]
  );

  return useMutation(doRunScript, {
    onError: (e, { params }) => {
      const error = new TXPrepareError(params, e);
      onTXPrepareError?.(error);
      throw error;
    },
  });
};
