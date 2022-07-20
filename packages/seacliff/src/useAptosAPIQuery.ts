import type { AptosError } from "@aptosis/aptos-api";
import type { AptosAPI, AptosAPIResponse } from "@aptosis/aptos-client";
import { raiseForStatus } from "@aptosis/aptos-client";
import { useAptosAPI } from "@aptosis/react-aptos-api";
import type { AxiosResponse } from "axios";
import type { QueryClient, UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery, useQueryClient } from "react-query";

import type { AptosAPIQueryType } from "./constants.js";

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

export type MakeAptosAPIQueryOpts<
  TQueryFnData,
  TData = TQueryFnData,
  TArgs extends readonly unknown[] = readonly unknown[]
> = Required<
  Pick<UseAptosAPIQueryOptions<TQueryFnData, TData, TArgs>, "queryKey">
> &
  Omit<UseAptosAPIQueryOptions<TQueryFnData, TData, TArgs>, "queryFn"> & {
    fetchData: (
      args: NonNullableTuple<TArgs>,
      signal?: AbortSignal
    ) => Promise<AxiosResponse<TQueryFnData, unknown> | null>;
    onSuccessfulFetch?: (
      args: NonNullableTuple<TArgs>,
      data: TQueryFnData | null
    ) => Promise<void>;
  };

export const makeAptosAPIQuery = <
  TQueryFnData,
  TData = TQueryFnData,
  TArgs extends readonly unknown[] = readonly unknown[]
>(
  opts: MakeAptosAPIQueryOpts<TQueryFnData, TData, TArgs>
): UseAptosAPIQueryOptions<TQueryFnData, TData, TArgs> => ({
  ...opts,
  queryFn: async ({ signal, queryKey }) => {
    if (queryKey.some((q) => q === null)) {
      return null;
    }
    const [_type, _nodeUrl, ...args] = queryKey as NonNullableTuple<
      AptosAPIQueryKey<TArgs>
    >;
    const response = await opts.fetchData(args, signal);
    if (response === null || response.status === 404) {
      await opts.onSuccessfulFetch?.(args, null);
      return null;
    }
    raiseForStatus(200, response as AptosAPIResponse<TQueryFnData>);
    await opts.onSuccessfulFetch?.(args, response.data);
    return response.data;
  },
  enabled:
    opts.enabled !== false && opts.queryKey.every((q) => q !== undefined),
});

export type AptosAPIQueryKeyArgs<T extends AptosAPIQueryKey> =
  T extends AptosAPIQueryKey<infer A> ? A : never;

export type UseAptosQueryParams<
  T,
  TArgs extends readonly unknown[],
  TData = T | null
> = readonly [
  ...args: TArgs,
  options?: UseAptosAPIQueryUserOptions<T, TData, AptosAPIQueryKey<TArgs>>
];

export type AptosAPIQueryFns<T, TArgs extends readonly unknown[]> = {
  /**
   * Builds the query key.
   */
  makeQueryKey: (nodeUrl: string, ...key: TArgs) => AptosAPIQueryKey<TArgs>;
  /**
   * Builds the query.
   */
  makeQuery: <TData = T | null>(
    ctx: APIQueryContext,
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

export type APIQueryContext = { aptos: AptosAPI; client: QueryClient };

/**
 * Builds functions related to a query.
 * @returns
 */
export const makeQueryFunctions = <
  T,
  TArgs extends readonly unknown[],
  N extends number = number
>({
  type,
  argCount,
  normalizeArgs = identity,
  fetchData,
  defaultQueryOptions,
  onSuccessfulFetch,
}: {
  type: AptosAPIQueryType;
  argCount: N;
  normalizeArgs?: (args: TArgs) => TArgs;
  fetchData: (
    ctx: APIQueryContext,
    args: NonNullableTuple<TArgs>,
    signal?: AbortSignal
  ) => Promise<AxiosResponse<T, unknown> | null>;
  onSuccessfulFetch?: (
    ctx: APIQueryContext,
    args: NonNullableTuple<TArgs>,
    data: T | null
  ) => Promise<void>;
  defaultQueryOptions?: Omit<
    UseAptosAPIQueryUserOptions<T, T, TArgs>,
    "onSuccess" | "onSettled" | "refetchInterval" | "select"
  >;
}): AptosAPIQueryFns<T, TArgs> => {
  const makeQueryKey = (
    nodeUrl: string,
    ...args: TArgs
  ): AptosAPIQueryKey<TArgs> => [type, nodeUrl, ...normalizeArgs(args)];
  const makeQuery = <TData = T | null>(
    ctx: APIQueryContext,
    args: TArgs,
    options?: UseAptosAPIQueryUserOptions<T, TData, TArgs>
  ): UseAptosAPIQueryOptions<T, TData, TArgs> =>
    makeAptosAPIQuery({
      ...defaultQueryOptions,
      ...options,
      onSuccessfulFetch: onSuccessfulFetch
        ? (args, data) => onSuccessfulFetch(ctx, args, data)
        : undefined,
      queryKey: makeQueryKey(ctx.aptos.nodeUrl, ...args),
      fetchData: (args, signal) => fetchData(ctx, args, signal),
    });

  /**
   * Fetches the requested resource via react-query.
   */
  const useQueryHook = <TData = T | null>(
    ...params: UseAptosQueryParams<T, TArgs, TData>
  ): UseQueryResult<TData, AptosError> => {
    const args = params.slice(0, argCount) as unknown as TArgs;
    const options = params[argCount - 1] as
      | UseAptosAPIQueryUserOptions<T, TData, TArgs>
      | undefined;
    const client = useQueryClient();
    const aptos = useAptosAPI();
    return useQuery(makeQuery<TData>({ aptos, client }, args, options));
  };

  return {
    makeQueryKey,
    makeQuery,
    useQuery: useQueryHook,
  };
};
