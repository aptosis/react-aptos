import type { AptosAPI } from "@movingco/aptos";
import type { AccountResource, Address } from "@movingco/aptos-api";
import type { QueryClient } from "react-query";
import { useQueries, useQuery, useQueryClient } from "react-query";

import { useAptos } from "../context.js";
import { useAptosAPI } from "../hooks.js";
import {
  ALL_RESOURCES_QUERY_PREFIX,
  RESOURCE_QUERY_PREFIX,
} from "./constants.js";
import type { UseAptosAPIQueryOptions } from "./useAptosAPIQuery.js";
import { makeQueryFunctions } from "./useAptosAPIQuery.js";

/**
 * Fetches a single resource.
 */
export const {
  makeQueryKey: makeResourceQueryKey,
  makeQuery: makeResourceQuery,
  useQuery: useResource,
} = makeQueryFunctions<
  AccountResource,
  readonly [
    owner: string | null | undefined,
    resourceType: string | null | undefined
  ]
>({
  type: RESOURCE_QUERY_PREFIX,
  normalizeArgs: ([owner, resourceType]) => [
    owner ? owner.toLowerCase() : owner,
    resourceType,
  ],
  fetchData: async (aptos, [owner, resourceType], signal) => {
    return await aptos.accounts.getAccountResource(
      { address: owner, resourceType },
      {
        signal,
      }
    );
  },
});

/**
 * Fetches all resources associated with an account.
 */
const allResources = makeQueryFunctions<
  readonly AccountResource[],
  readonly [owner: Address | null | undefined]
>({
  type: ALL_RESOURCES_QUERY_PREFIX,
  normalizeArgs: ([owner]) => [owner ? owner.toLowerCase() : owner],
  fetchData: async (aptos, [owner], signal) => {
    return await aptos.accounts.getAccountResources(
      { address: owner },
      {
        signal,
      }
    );
  },
});

export const { makeQueryKey: makeAllResourcesQueryKey } = allResources;

export const makeAllResourcesQuery = (
  aptos: AptosAPI,
  client: QueryClient,
  owner: Address | null | undefined
): UseAptosAPIQueryOptions<
  readonly AccountResource[],
  readonly AccountResource[] | null,
  readonly [owner: Address | null | undefined]
> =>
  allResources.makeQuery(aptos, [owner], {
    onSuccess: (d) => {
      if (d) {
        client.setQueriesData(
          d.map((v) => makeResourceQueryKey(aptos.nodeUrl, owner, v.type)),
          d
        );
      } else {
        // null, data should be cleared
        void client.invalidateQueries([RESOURCE_QUERY_PREFIX, owner]);
      }
    },
    staleTime: 500,
  });

/**
 * Fetches multiple resources.
 * @param owner
 * @param resourceType
 * @returns
 */
export const useResources = (
  owner: string | null | undefined,
  resourceTypes: readonly string[]
) => {
  const aptos = useAptosAPI();
  return useQueries(
    resourceTypes.map((rt) => makeResourceQuery(aptos, [owner, rt]))
  );
};

/**
 * Fetches all resources.
 * @param owner
 * @returns
 */
export const useAllResources = (owner: string | null | undefined) => {
  const aptos = useAptosAPI();
  const client = useQueryClient();
  return useQuery(makeAllResourcesQuery(aptos, client, owner));
};

/**
 * Fetches all of the user's resources.
 * @returns
 */
export const useAllUserResources = () => {
  const { wallet } = useAptos();
  return useAllResources(wallet?.selectedAccount);
};
