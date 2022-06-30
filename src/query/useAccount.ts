import type { Account, Address, AptosError } from "@movingco/aptos-api";
import { raiseForStatus } from "aptos";
import type { AxiosResponse } from "axios";
import type { UseQueryOptions } from "react-query";
import { useQuery } from "react-query";

import type { AptosAPI } from "../aptos.js";
import { useAptosAPI } from "../provider.js";

export const makeAccountQueryKey = (
  nodeUrl: string,
  address: Address | null | undefined
) => [
  "react-aptos/account",
  nodeUrl,
  address ? address.toLowerCase() : address,
];

export const makeAccountQuery = (
  aptos: AptosAPI,
  address: Address | null | undefined
): UseQueryOptions<Account | null, AptosError> => ({
  queryKey: makeAccountQueryKey(aptos.nodeUrl, address),
  queryFn: async ({ signal }) => {
    if (!address) {
      return null;
    }
    const response = await aptos.accounts.getAccount(address, {
      signal,
    });
    if (response.status === 404) {
      return null;
    }
    raiseForStatus(200, response as AxiosResponse<Account, AptosError>);
    return response.data;
  },
  enabled: address !== undefined,
});

/**
 * Fetches an individual account.
 *
 * @param address
 * @returns
 */
export const useAccount = (address: Address | null | undefined) => {
  const aptos = useAptosAPI();
  return useQuery(makeAccountQuery(aptos, address));
};
