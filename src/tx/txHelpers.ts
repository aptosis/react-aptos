import type {
  ScriptFunctionPayload,
  UserTransaction,
} from "@movingco/aptos-api";

export type SendParams = Pick<ScriptFunctionPayload, "function"> &
  Partial<Pick<ScriptFunctionPayload, "type_arguments" | "arguments">>;

export class FailedTXError extends Error {
  constructor(readonly result: UserTransaction) {
    super("Failed transaction");
  }
}
