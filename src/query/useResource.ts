import type { AptosAPI } from "@movingco/aptos";
import type { AccountResource, AptosError } from "@movingco/aptos-api";
import { raiseForStatus } from "aptos";
import type { AxiosResponse } from "axios";
import type { QueryClient, UseQueryOptions } from "react-query";
import { useQueries, useQuery, useQueryClient } from "react-query";

import { useAptos } from "../context.js";
import { useAptosAPI } from "../hooks.js";
import {
  ALL_RESOURCES_QUERY_PREFIX,
  RESOURCE_QUERY_PREFIX,
} from "./constants.js";

export const makeResourceQueryKey = (
  owner: string | null | undefined,
  resourceType: string | null | undefined
) => [RESOURCE_QUERY_PREFIX, owner ? owner.toLowerCase() : owner, resourceType];

export const makeAllResourcesQueryKey = (owner: string | null | undefined) => [
  ALL_RESOURCES_QUERY_PREFIX,
  owner ? owner.toLowerCase() : owner,
];

export const makeResourceQuery = (
  aptos: AptosAPI,
  owner: string | null | undefined,
  resourceType: string | null | undefined
): UseQueryOptions<AccountResource | null, AptosError> => ({
  queryKey: makeResourceQueryKey(owner, resourceType),
  queryFn: async ({ signal }) => {
    if (!owner || !resourceType) {
      return null;
    }
    const response = await aptos.accounts.getAccountResource(
      {
        address: owner,
        resourceType,
      },
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
  aptos: AptosAPI,
  client: QueryClient,
  owner: string | null | undefined
): UseQueryOptions<readonly AccountResource[] | null, AptosError> => ({
  queryKey: makeAllResourcesQueryKey(owner),
  queryFn: async ({ signal }) => {
    if (!owner) {
      return null;
    }
    const response = await aptos.accounts.getAccountResources(
      { address: owner },
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
      void client.invalidateQueries([RESOURCE_QUERY_PREFIX, owner]);
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
  const aptos = useAptosAPI();
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
  const aptos = useAptosAPI();
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
