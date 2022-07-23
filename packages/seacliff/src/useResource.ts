import type { AccountResource } from "@aptosis/aptos-api";
import type { MaybeHexString } from "@movingco/core";
import { Address, mapN } from "@movingco/core";

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
    owner ? Address.ensure(owner).hex() : owner,
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
  readonly [owner: MaybeHexString | null | undefined]
>({
  type: ALL_RESOURCES_QUERY_PREFIX,
  argCount: 1,
  normalizeArgs: ([owner]) => [
    mapN((owner) => Address.ensure(owner).hex(), owner),
  ],
  fetchData: async ({ aptos }, [owner], signal) => {
    return await aptos.accounts.getAccountResources(
      { address: Address.ensure(owner).hex() },
      {
        signal,
      }
    );
  },
  onSuccessfulFetch: ({ aptos, client }, [owner], data) => {
    if (data) {
      client.setQueriesData(
        data.map((v) =>
          makeResourceQueryKey(
            aptos.nodeUrl,
            Address.ensure(owner).hex(),
            v.type
          )
        ),
        data
      );
    } else {
      // null, data should be cleared
      void client.invalidateQueries([RESOURCE_QUERY_PREFIX, owner]);
    }
    return Promise.resolve();
  },
  defaultQueryOptions: {
    staleTime: 500,
  },
});

export const {
  makeQueryKey: makeAllResourcesQueryKey,
  makeQuery: makeAllResourcesQuery,
  useQuery: useAllResources,
  useQueries: useAllResourcesMulti,
} = allResources;
