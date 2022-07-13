import type { Account, Address } from "@aptosis/aptos-api";

import { ACCOUNT_QUERY_PREFIX } from "./constants.js";
import { makeQueryFunctions } from "./useAptosAPIQuery.js";

/**
 * Fetches an account.
 */
export const {
  makeQueryKey: makeAccountQueryKey,
  makeQuery: makeAccountQuery,
  useQuery: useAccount,
} = makeQueryFunctions<
  Account,
  readonly [address: Address | null | undefined],
  1
>({
  type: ACCOUNT_QUERY_PREFIX,
  argCount: 1,
  fetchData: async ({ aptos }, [address], signal) => {
    return await aptos.accounts.getAccount(address, {
      signal,
    });
  },
});
