import type { AccountResource, AptosError } from "@movingco/aptos-api";
import type { AptosClient } from "aptos";
import { raiseForStatus } from "aptos";
import type { AxiosResponse } from "axios";
import type { QueryClient, UseQueryOptions } from "react-query";
import { useQueries, useQuery, useQueryClient } from "react-query";

import { useAptos } from "../context.js";
import { useAptosClient } from "../provider.js";

export const makeResourceQueryKey = (
  owner: string | null | undefined,
  resourceType: string | null | undefined
) => [
  "react-aptos/resource",
  owner ? owner.toLowerCase() : owner,
  resourceType,
];

export const makeAllResourcesQueryKey = (owner: string | null | undefined) => [
  "react-aptos/allResources",
  owner ? owner.toLowerCase() : owner,
];

export const makeResourceQuery = (
  aptos: AptosClient,
  owner: string | null | undefined,
  resourceType: string | null | undefined
): UseQueryOptions<AccountResource | null, AptosError> => ({
  queryKey: makeResourceQueryKey(owner, resourceType),
  queryFn: async ({ signal }) => {
    if (!owner || !resourceType) {
      return null;
    }
    const response = await aptos.accounts.getAccountResource(
      owner,
      resourceType,
      undefined,
      { signal }
    );
    if (response.status === 404) {
      return null;
    }
    raiseForStatus(200, response as AxiosResponse<AccountResource, AptosError>);
    return response.data;
  },
  enabled: owner !== undefined && resourceType !== undefined,
});

export const makeAllResourcesQuery = (
  aptos: AptosClient,
  client: QueryClient,
  owner: string | null | undefined
): UseQueryOptions<readonly AccountResource[] | null, AptosError> => ({
  queryKey: makeAllResourcesQueryKey(owner),
  queryFn: async ({ signal }) => {
    if (!owner) {
      return null;
    }
    const response = await aptos.accounts.getAccountResources(
      owner,
      undefined,
      { signal }
    );
    if (response.status === 404) {
      return null;
    }
    raiseForStatus(
      200,
      response as AxiosResponse<AccountResource[], AptosError>
    );
    return response.data;
  },
  onSuccess: (d) => {
    if (d) {
      client.setQueriesData(
        d.map((v) => makeResourceQueryKey(owner, v.type)),
        d
      );
    } else {
      // null, data should be cleared
      void client.invalidateQueries(["react-aptos/resource", owner]);
    }
  },
  enabled: owner !== undefined,
  staleTime: 500,
});

/**
 * Fetches an individual resource.
 * @param owner
 * @param resourceType
 * @returns
 */
export const useResource = (
  owner: string | null | undefined,
  resourceType: string | null | undefined
) => {
  const aptos = useAptosClient();
  return useQuery(makeResourceQuery(aptos, owner, resourceType));
};

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
  const aptos = useAptosClient();
  return useQueries(
    resourceTypes.map((rt) => makeResourceQuery(aptos, owner, rt))
  );
};

/**
 * Fetches all resources.
 * @param owner
 * @returns
 */
export const useAllResources = (owner: string | null | undefined) => {
  const aptos = useAptosClient();
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
