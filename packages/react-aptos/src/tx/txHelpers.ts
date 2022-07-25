import type {
  ScriptFunctionPayload,
  UserTransaction,
} from "@aptosis/aptos-common";

export type SendParams = Pick<ScriptFunctionPayload, "function"> &
  Partial<Pick<ScriptFunctionPayload, "type_arguments" | "arguments">>;

/**
 * Thrown when a transaction fails on-chain.
 */
export class TXRevertError extends Error {
  constructor(readonly result: UserTransaction) {
    super("Transaction failed");
  }
}

/**
 * Thrown when a transaction could not be prepared. (signed and sent)
 */
export class TXPrepareError extends Error {
  constructor(readonly data: SendParams, readonly error: unknown) {
    super("Error preparing transaction");
  }
}
