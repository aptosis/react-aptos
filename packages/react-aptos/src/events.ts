import type { UserTransaction } from "@movingco/aptos-api";
import type { SignAndSendTransactionResult } from "@omnimask/provider-interface";
import { createContainer } from "unstated-next";

import type { SendParams, TXPrepareError, TXRevertError } from "./index.js";

/**
 * Handlers for error events.
 */
export interface AptosErrorEventHandlers {
  /**
   * Called when the signature for a transaction is requested.
   */
  onTXPrepareError?: (err: TXPrepareError) => void;
  /**
   * Called when a transaction reverts. (fails on-chain)
   */
  onTXRevertError?: (data: TXRevertError) => void;
}

export interface AptosEventHandlers extends AptosErrorEventHandlers {
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
}

export type NotifyFn = (args: {
  message: string;
  txid?: string;
  type?: "error";
  description?: string;
}) => void;

export const buildDefaultErrorHandlers = (
  notify: NotifyFn
): AptosErrorEventHandlers => ({
  onTXPrepareError: (err) => {
    console.error("[TXPrepareError]", err);
    notify({
      message: "Error preparing transaction",
      type: "error",
      description:
        err instanceof Error ? err.message : "An unknown error occurred.",
    });
  },
  onTXRevertError(err) {
    console.error("[TXRevertError]", err);
    notify({
      message: `Transaction failed`,
      type: "error",
      description: err.result.vm_status,
      txid: err.result.version,
    });
  },
});

export const buildDefaultEventHandlers = (
  notify: NotifyFn
): AptosEventHandlers => ({
  ...buildDefaultErrorHandlers(notify),
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
  onTXSend(data) {
    notify({
      message: `Transaction sent`,
      txid: data.result.hash,
    });
  },
});

const useAptosEventHandlersInner = (handlers: AptosEventHandlers = {}) => {
  return handlers;
};

export const {
  useContainer: useAptosEventHandlers,
  Provider: AptosEventHandlersProvider,
} = createContainer(useAptosEventHandlersInner);
