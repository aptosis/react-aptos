import { raiseForStatus, useSeacliff } from "@aptosis/seacliff";
import type { AptosAPI } from "@movingco/aptos";
import type {
  AptosError,
  HexEncodedBytes,
  Transaction,
  UserTransaction,
} from "@movingco/aptos-api";
import { sleep } from "@movingco/core";
import type { AxiosResponse } from "axios";
import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { useAptosEventHandlers } from "../events.js";
import { TXRevertError } from "./txHelpers.js";
import { useHandleTXSuccess } from "./useHandleTXSuccess.js";

/**
 * Helper for fetching a transaction from the API.
 */
export const fetchTransaction = async (
  aptos: AptosAPI,
  txnHash: HexEncodedBytes
): Promise<Transaction | null> => {
  const response = await aptos.transactions.getTransaction(txnHash);
  if (response.status === 404) {
    return null;
  }
  raiseForStatus(
    200,
    response as AxiosResponse<Transaction, AptosError>,
    txnHash
  );
  return response.data;
};

/**
 * Attempts to confirm a transaction via polling.
 * @param aptos
 * @param txnHash
 * @param retryIntervalMs interval between retries to fetch the transaction
 * @returns
 */
export const confirmTransaction = async (
  aptos: AptosAPI,
  txnHash: HexEncodedBytes,
  retryIntervalMs = 500
): Promise<Transaction> => {
  let count = 0;
  let tx = await fetchTransaction(aptos, txnHash);
  while (!tx || tx.type === "pending_transaction") {
    await sleep(retryIntervalMs);
    count += 1;
    if (count >= 10) {
      throw new Error(`Waiting for transaction ${txnHash} timed out!`);
    }
    tx = await fetchTransaction(aptos, txnHash);
  }
  return tx;
};

export const useConfirmTX = (): UseMutationResult<
  UserTransaction,
  unknown,
  string
> => {
  const { aptosAPI } = useSeacliff();
  const { onTXSuccess, onTXRevertError: onTXError } = useAptosEventHandlers();
  const onSuccess = useHandleTXSuccess();
  return useMutation(
    async (txHash: string) => {
      const txResult = (await confirmTransaction(
        aptosAPI,
        txHash
      )) as UserTransaction;
      if (!txResult.success) {
        throw new TXRevertError(txResult);
      }
      return txResult;
    },
    {
      onSuccess: (data) => {
        onTXSuccess?.(data);
        onSuccess(data);
      },
      onError: (err) => {
        if (err instanceof TXRevertError) {
          onTXError?.(err);
        }
      },
    }
  );
};
