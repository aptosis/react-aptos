import type { Account, Address } from "@movingco/aptos-api";

import { ACCOUNT_QUERY_PREFIX } from "./constants.js";
import { makeQueryFunctions } from "./useAptosAPIQuery.js";

/**
 * Fetches an account.
 */
export const {
  makeQueryKey: makeAccountQueryKey,
  makeQuery: makeAccountQuery,
  useQuery: useAccount,
} = makeQueryFunctions<Account, readonly [address: Address | null | undefined]>(
  {
    type: ACCOUNT_QUERY_PREFIX,
    fetchData: async (aptos, [address], signal) => {
      return await aptos.accounts.getAccount(address, {
        signal,
      });
    },
  }
);