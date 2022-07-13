import type { AccountResource, Address } from "@movingco/aptos-api";

import {
  ALL_RESOURCES_QUERY_PREFIX,
  RESOURCE_QUERY_PREFIX,
} from "./constants.js";
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
  argCount: 2,
  normalizeArgs: ([owner, resourceType]) => [
    owner ? owner.toLowerCase() : owner,
    resourceType,
  ],
  fetchData: async ({ aptos }, [owner, resourceType], signal) => {
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
  argCount: 1,
  normalizeArgs: ([owner]) => [owner ? owner.toLowerCase() : owner],
  fetchData: async ({ aptos, client }, [owner], signal) => {
    const response = await aptos.accounts.getAccountResources(
      { address: owner },
      {
        signal,
      }
    );
    const { data } = response;
    if (data) {
      client.setQueriesData(
        data.map((v) => makeResourceQueryKey(aptos.nodeUrl, owner, v.type)),
        data
      );
    } else {
      // null, data should be cleared
      void client.invalidateQueries([RESOURCE_QUERY_PREFIX, owner]);
    }
    return response;
  },
  defaultQueryOptions: {
    staleTime: 500,
  },
});

export const {
  makeQueryKey: makeAllResourcesQueryKey,
  makeQuery: makeAllResourcesQuery,
  useQuery: useAllResources,
} = allResources;
