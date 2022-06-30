import type { AptosAPI } from "@movingco/aptos";
import type { Account, Address } from "@movingco/aptos-api";
import { useQuery } from "react-query";

import { useAptosAPI } from "../provider.js";
import { ACCOUNT_QUERY_PREFIX } from "./constants.js";
import type {
  UseAptosAPIQueryOptions,
  UseAptosAPIQueryUserOptions,
} from "./useAptosAPIQuery.js";
import { makeAptosAPIQuery } from "./useAptosAPIQuery.js";

export const makeAccountQueryKey = (
  nodeUrl: string,
  address: Address | null | undefined
) =>
  [
    ACCOUNT_QUERY_PREFIX,
    nodeUrl,
    address ? address.toLowerCase() : address,
  ] as const;

export const makeAccountQuery = <TData = Account | null>(
  aptos: AptosAPI,
  address: Address | null | undefined,
  options: UseAptosAPIQueryUserOptions<
    Account,
    TData,
    ReturnType<typeof makeAccountQueryKey>
  > = {}
): UseAptosAPIQueryOptions<
  Account,
  TData,
  ReturnType<typeof makeAccountQueryKey>
> =>
  makeAptosAPIQuery({
    queryKey: makeAccountQueryKey(aptos.nodeUrl, address),
    fetchData: async ([_, address], signal) => {
      return await aptos.accounts.getAccount(address, {
        signal,
      });
    },
    ...options,
  });

/**
 * Fetches an individual account.
 *
 * @param address
 * @returns
 */
export const useAccount = <TData = Account | null>(
  address: Address | null | undefined,
  options: UseAptosAPIQueryUserOptions<
    Account,
    TData,
    ReturnType<typeof makeAccountQueryKey>
  > = {}
) => {
  const aptos = useAptosAPI();
  return useQuery(makeAccountQuery(aptos, address, options));
};
