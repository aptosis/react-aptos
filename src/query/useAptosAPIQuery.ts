import type { AptosError } from "@movingco/aptos-api";
import { raiseForStatus } from "aptos";
import type { AxiosResponse } from "axios";
import type { UseQueryOptions } from "react-query";

type AptosAPIQueryKey = readonly unknown[];

export type UseAptosAPIQueryOptions<
  TQueryFnData,
  TData = TQueryFnData | null,
  TQueryKey extends AptosAPIQueryKey = AptosAPIQueryKey
> = UseQueryOptions<TQueryFnData | null, AptosError, TData, TQueryKey>;

export type UseAptosAPIQueryUserOptions<
  TQueryFnData,
  TData = TQueryFnData,
  TQueryKey extends AptosAPIQueryKey = AptosAPIQueryKey
> = Omit<
  UseAptosAPIQueryOptions<TQueryFnData, TData, TQueryKey>,
  "queryFn" | "queryKey"
>;

type NonNullableQueryKey<K extends AptosAPIQueryKey> = {
  [I in keyof K]: NonNullable<K[I]>;
};

export const makeAptosAPIQuery = <
  TQueryFnData,
  TData = TQueryFnData,
  TQueryKey extends AptosAPIQueryKey = AptosAPIQueryKey
>(
  opts: Required<
    Pick<UseAptosAPIQueryOptions<TQueryFnData, TData, TQueryKey>, "queryKey">
  > &
    Omit<UseAptosAPIQueryOptions<TQueryFnData, TData, TQueryKey>, "queryFn"> & {
      fetchData: (
        queryKey: NonNullableQueryKey<TQueryKey>,
        signal?: AbortSignal
      ) => Promise<AxiosResponse<TQueryFnData, unknown> | null>;
    }
): UseAptosAPIQueryOptions<TQueryFnData, TData, TQueryKey> => ({
  ...opts,
  queryFn: async ({ signal }) => {
    if (!opts.queryKey.every((q) => q !== null)) {
      return null;
    }
    const queryKey = opts.queryKey as NonNullableQueryKey<TQueryKey>;
    const response = await opts.fetchData(queryKey, signal);
    if (response === null || response.status === 404) {
      return null;
    }
    raiseForStatus(200, response as AxiosResponse<TQueryFnData, AptosError>);
    return response.data;
  },
  enabled:
    opts.enabled !== false && opts.queryKey.every((q) => q !== undefined),
});
