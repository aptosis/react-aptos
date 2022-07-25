import type { MultiAgentSignature } from "@aptosis/aptos-api";
import type {
  AccountObject,
  ByteStringHex,
  TransactionPayload,
  UserTransactionRequest,
} from "@aptosis/aptos-common";
import { Account } from "@aptosis/aptos-common";
import { useAccount, useAptosAPI } from "@aptosis/seacliff";
import { HexString } from "@movingco/core";
import type {
  SignAndSendTransactionResult,
  TXSendOptions,
} from "@omnimask/provider-interface";
import { OmniRPC } from "@omnimask/provider-interface";
import { useCallback } from "react";

import { ensureProvider, useOmni } from "./context.js";

export interface SendTransactionParams extends TXSendOptions {
  readonly payload: TransactionPayload;
  readonly options?: Partial<
    UserTransactionRequest & {
      /**
       * Additional signers.
       */
      secondary_signers?: readonly AccountObject[];
    }
  >;
}

export type SendTransactionFn = (
  params: SendTransactionParams
) => Promise<SignAndSendTransactionResult>;

export const useSendTransaction = (): SendTransactionFn => {
  const { provider, wallet } = useOmni();
  const aptos = useAptosAPI();
  const { data: account } = useAccount(wallet?.selectedAccount);
  return useCallback(
    async ({ payload, options = {}, ...rest }: SendTransactionParams) => {
      ensureProvider(provider);
      if (!wallet) {
        throw new Error("Wallet not connected");
      }
      if (!wallet.selectedAccount) {
        throw new Error("Account not selected");
      }
      if (!account) {
        throw new Error("Account not loaded");
      }

      // build the request
      const { secondary_signers } = options;
      const request: UserTransactionRequest = {
        sender: wallet.selectedAccount,
        sequence_number: account.sequence_number,
        max_gas_amount: "1000",
        gas_unit_price: "1",
        gas_currency_code: "XUS",
        // Unix timestamp, in seconds + 10 seconds
        expiration_timestamp_secs: (
          Math.floor(Date.now() / 1_000) + 10
        ).toString(),
        payload,
        ...(secondary_signers
          ? { secondary_signers: secondary_signers.map((s) => s.address) }
          : {}),
        ...options,
      };

      const {
        data: { message },
      } = await aptos.transactions.createSigningMessage(request);

      let multiAgentSignature:
        | Pick<
            MultiAgentSignature,
            "secondary_signer_addresses" | "secondary_signers"
          >
        | undefined = undefined;
      if (secondary_signers) {
        const signers = secondary_signers.map((s) => Account.fromObject(s));
        const messageHex = HexString.ensure(message);
        multiAgentSignature = {
          secondary_signer_addresses: signers.map((acc) => acc.address.hex()),
          secondary_signers: await Promise.all(
            signers.map(async (acc) => ({
              type: "ed25519_signature",
              public_key: acc.pubKey.hex(),
              signature: HexString.fromUint8Array(
                await acc.signData(messageHex.toUint8Array())
              ).hex(),
            }))
          ),
        };
      }

      return await provider.request({
        method: OmniRPC.SignAndSendRawTransaction,
        params: {
          ...rest,
          request,
          message: message as ByteStringHex,
          multi_agent_signature: multiAgentSignature,
        },
      });
    },
    [account, aptos, provider, wallet]
  );
};
