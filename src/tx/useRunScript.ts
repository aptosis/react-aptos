import type { SignAndSendTransactionParams } from "@omnimask/provider-interface";
import { useCallback } from "react";
import { useMutation } from "react-query";

import { useSendTransaction } from "../omni/useSendTransaction.js";
import type { SendParams } from "./txHelpers.js";
import { useConfirmTX } from "./useConfirmTX.js";

export const useRunScript = () => {
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
      //   notify({
      //     message: `Requesting signature for action: ${fn}`,
      //   });
      const tx = await sendTransaction({
        payload: {
          type: "script_function_payload",
          type_arguments,
          arguments: args,
          function: fn,
        },
        options,
      });

      //   notify({
      //     message: `Transaction sent`,
      //     txid: tx.result.hash,
      //   });

      return await confirmTransaction.mutateAsync(tx.result.hash);
    },
    [confirmTransaction, sendTransaction]
  );

  return useMutation(doRunScript);
};
