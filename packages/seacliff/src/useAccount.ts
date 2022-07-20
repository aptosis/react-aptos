import type { Account } from "@aptosis/aptos-api";
import type { MaybeHexString } from "@movingco/core";
import { Address, mapN } from "@movingco/core";

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
  readonly [address: MaybeHexString | null | undefined],
  1
>({
  type: ACCOUNT_QUERY_PREFIX,
  argCount: 1,
  normalizeArgs: ([address]) => [
    mapN((address) => Address.ensure(address).hex(), address),
  ],
  fetchData: async ({ aptos }, [address], signal) => {
    return await aptos.accounts.getAccount(Address.ensure(address).hex(), {
      signal,
    });
  },
});
