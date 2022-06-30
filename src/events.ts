import type { UserTransaction } from "@movingco/aptos-api";
import type { SignAndSendTransactionResult } from "@omnimask/provider-interface";

import type { FailedTXError, SendParams } from "./index.js";

export interface AptosEventHandlers {
  /**
   * Called when the signature for a transaction is requested.
   */
  onTXRequest?: (data: SendParams) => void;
  /**
   * Called when a transaction is sent.
   */
  onTXSend?: (data: SignAndSendTransactionResult) => void;
  /**
   * Called when a transaction is confirmed successfully.
   */
  onTXSuccess?: (data: UserTransaction) => void;
  /**
   * Called when a transaction fails.
   */
  onTXError?: (data: FailedTXError) => void;
}

export type NotifyFn = (args: {
  message: string;
  txid?: string;
  type?: "error";
  description?: string;
}) => void;

export const buildDefaultEventHandlers = (
  notify: NotifyFn
): AptosEventHandlers => ({
  onTXRequest: (data) => {
    notify({
      message: `Requesting signature for action: ${data.function}`,
    });
  },
  onTXSuccess(data) {
    notify({
      message: `Transaction confirmed`,
      description: data.vm_status,
    });
  },
  onTXError(err) {
    notify({
      message: `Transaction failed`,
      type: "error",
      description: err.result.vm_status,
    });
  },
  onTXSend(data) {
    notify({
      message: `Transaction sent`,
      txid: data.result.hash,
    });
  },
});
