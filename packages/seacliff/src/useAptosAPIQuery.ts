import type { AptosAPI } from "@movingco/aptos";
import type { AptosError } from "@movingco/aptos-api";
import { raiseForStatus } from "aptos";
import type { AxiosResponse } from "axios";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { AptosAPIQueryType } from "./constants.js";
import { useAptosAPI } from "./hooks.js";

export type AptosAPIQueryKey<
  TArgs extends readonly unknown[] = readonly unknown[]
> = readonly [
  AptosAPIQueryType,
  string, // node URL
  ...TArgs
];

export type UseAptosAPIQueryOptions<
  TQueryFnData,
  TData = TQueryFnData | null,
  TArgs extends readonly unknown[] = readonly unknown[]
> = UseQueryOptions<
  TQueryFnData | null,
  AptosError,
  TData,
  AptosAPIQueryKey<TArgs>
>;

export type UseAptosAPIQueryUserOptions<
  TQueryFnData,
  TData = TQueryFnData,
  TArgs extends readonly unknown[] = readonly unknown[]
> = Omit<
  UseAptosAPIQueryOptions<TQueryFnData, TData, TArgs>,
  "queryFn" | "queryKey"
>;

type NonNullableTuple<T extends readonly unknown[]> = {
  [I in keyof T]: NonNullable<T[I]>;
};

export const makeAptosAPIQuery = <
  TQueryFnData,
  TData = TQueryFnData,
  TArgs extends readonly unknown[] = readonly unknown[]
>(
  opts: Required<
    Pick<UseAptosAPIQueryOptions<TQueryFnData, TData, TArgs>, "queryKey">
  > &
    Omit<UseAptosAPIQueryOptions<TQueryFnData, TData, TArgs>, "queryFn"> & {
      fetchData: (
        args: NonNullableTuple<TArgs>,
        signal?: AbortSignal
      ) => Promise<AxiosResponse<TQueryFnData, unknown> | null>;
    }
): UseAptosAPIQueryOptions<TQueryFnData, TData, TArgs> => ({
  ...opts,
  queryFn: async ({ signal }) => {
    if (opts.queryKey.some((q) => q === null)) {
      return null;
    }
    const [_type, _nodeUrl, ...args] = opts.queryKey as NonNullableTuple<
      AptosAPIQueryKey<TArgs>
    >;
    const response = await opts.fetchData(args, signal);
    if (response === null || response.status === 404) {
      return null;
    }
    raiseForStatus(200, response as AxiosResponse<TQueryFnData, AptosError>);
    return response.data;
  },
  enabled:
    opts.enabled !== false && opts.queryKey.every((q) => q !== undefined),
});

export type AptosAPIQueryKeyArgs<T extends AptosAPIQueryKey> =
  T extends AptosAPIQueryKey<infer A> ? A : never;

type UseAptosQueryParams<
  T,
  TArgs extends readonly unknown[],
  TData = T | null
> = readonly [
  ...args: TArgs,
  options?: UseAptosAPIQueryUserOptions<T, TData, AptosAPIQueryKey<TArgs>>
];

type AptosAPIQueryFns<T, TArgs extends readonly unknown[]> = {
  /**
   * Builds the query key.
   */
  makeQueryKey: (nodeUrl: string, ...key: TArgs) => AptosAPIQueryKey<TArgs>;
  /**
   * Builds the query.
   */
  makeQuery: <TData = T | null>(
    aptos: AptosAPI,
    args: TArgs,
    options?: UseAptosAPIQueryUserOptions<T, TData, TArgs>
  ) => UseAptosAPIQueryOptions<T, TData, TArgs>;

  /**
   * Hook for fetching the query.
   */
  useQuery: <TData = T | null>(
    ...params: UseAptosQueryParams<T, TArgs, TData>
  ) => UseQueryResult<TData, AptosError>;
};

/**
 * The identity function.
 * @param input
 * @returns
 */
const identity = <T>(input: T): T => input;

/**
 * Builds functions related to a query.
 * @returns
 */
export const makeQueryFunctions = <T, TArgs extends readonly unknown[]>({
  type,
  normalizeArgs = identity,
  fetchData,
}: {
  type: AptosAPIQueryType;
  normalizeArgs?: (args: TArgs) => TArgs;
  fetchData: (
    aptosAPI: AptosAPI,
    args: NonNullableTuple<TArgs>,
    signal?: AbortSignal
  ) => Promise<AxiosResponse<T, unknown> | null>;
}): AptosAPIQueryFns<T, TArgs> => {
  const makeQueryKey = (
    nodeUrl: string,
    ...args: TArgs
  ): AptosAPIQueryKey<TArgs> => [type, nodeUrl, ...normalizeArgs(args)];
  const makeQuery = <TData = T | null>(
    aptos: AptosAPI,
    args: TArgs,
    options?: UseAptosAPIQueryUserOptions<T, TData, TArgs>
  ): UseAptosAPIQueryOptions<T, TData, TArgs> =>
    makeAptosAPIQuery({
      ...options,
      queryKey: makeQueryKey(aptos.nodeUrl, ...args),
      fetchData: (args, signal) => fetchData(aptos, args, signal),
    });

  /**
   * Fetches the requested resource via react-query.
   */
  const useQueryHook = <TData = T | null>(
    ...params: UseAptosQueryParams<T, TArgs, TData>
  ): UseQueryResult<TData, AptosError> => {
    const args = params.slice(0, params.length - 1) as unknown as TArgs;
    const options = params[params.length - 1] as
      | UseAptosAPIQueryUserOptions<T, TData, TArgs>
      | undefined;
    const aptos = useAptosAPI();
    return useQuery(makeQuery<TData>(aptos, args, options));
  };

  return {
    makeQueryKey,
    makeQuery,
    useQuery: useQueryHook,
  };
};
