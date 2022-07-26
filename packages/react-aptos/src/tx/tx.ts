import type { UserTransaction } from "@aptosis/aptos-common";
import type { SignAndSendTransactionResult } from "@omnimask/provider-interface";

import type { SendParams, TXPrepareError, TXRevertError } from "./txHelpers.js";

export class AptosTransaction {
  private _sendHandlers: ((data: SignAndSendTransactionResult) => void)[] = [];
  private _successHandlers: ((data: UserTransaction) => void)[] = [];
  private _errorHandlers: ((err: TXRevertError | TXPrepareError) => void)[] =
    [];

  constructor(readonly title: string, readonly data: SendParams) {}

  /**
   * Constructs a promise.
   * @returns
   */
  promise = (): Promise<UserTransaction> => {
    return new Promise((resolve, reject) => {
      this.onSuccess(resolve);
      this.onError(reject);
    });
  };

  handleSend = (data: SignAndSendTransactionResult): void => {
    this._sendHandlers.forEach((handler) => handler(data));
  };

  handleSuccess = (data: UserTransaction): void => {
    this._successHandlers.forEach((handler) => handler(data));
  };

  handleError = (err: TXRevertError | TXPrepareError): void => {
    this._errorHandlers.forEach((handler) => handler(err));
  };

  onSend = (cb: (data: SignAndSendTransactionResult) => void): void => {
    this._sendHandlers.push(cb);
  };

  onSuccess = (cb: (data: UserTransaction) => void): void => {
    this._successHandlers.push(cb);
  };

  onError = (cb: (err: TXRevertError | TXPrepareError) => void): void => {
    this._errorHandlers.push(cb);
  };
}
