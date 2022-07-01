import type {
  MultiAgentSignature,
  TransactionPayload,
  UserTransactionRequest,
} from "@movingco/aptos-api";
import type { AccountObject } from "@omnimask/provider-interface";
import { OmniRPC } from "@omnimask/provider-interface";
import { AptosAccount, HexString } from "aptos";
import { useCallback } from "react";

import { useAptosAPI } from "../hooks.js";
import { useAccount } from "../query/useAccount.js";
import { ensureProvider, useOmni } from "./context.js";

export type SendTransactionParams = {
  payload: TransactionPayload;
  options?: Partial<
    UserTransactionRequest & {
      /**
       * Additional signers.
       */
      secondary_signers?: readonly AccountObject[];
    }
  >;
};

export const useSendTransaction = () => {
  const { provider, wallet } = useOmni();
  const aptos = useAptosAPI();
  const { data: account } = useAccount(wallet?.selectedAccount);
  return useCallback(
    async ({ payload, options = {} }: SendTransactionParams) => {
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
        const signers = secondary_signers.map((s) =>
          AptosAccount.fromAptosAccountObject(s)
        );
        const messageHex = HexString.ensure(message);
        multiAgentSignature = {
          secondary_signer_addresses: signers.map((acc) => acc.address().hex()),
          secondary_signers: signers.map((acc) => ({
            type: "ed25519_signature",
            public_key: acc.pubKey().hex(),
            signature: acc.signHexString(messageHex).hex(),
          })),
        };
      }

      return await provider.request({
        method: OmniRPC.SignAndSendRawTransaction,
        params: {
          request,
          message,
          multi_agent_signature: multiAgentSignature,
        },
      });
    },
    [account, aptos, provider, wallet]
  );
};
