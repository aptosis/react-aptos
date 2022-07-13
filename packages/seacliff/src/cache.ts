import type {
  Account,
  AccountResource,
  DeleteResource,
  UserTransaction,
  WriteResource,
  WriteSetChange,
} from "@movingco/aptos-api";
import { HexString } from "@movingco/core";
import { default as groupBy } from "lodash.groupby";
import { default as keyBy } from "lodash.keyby";
import { useCallback } from "react";
import type { QueryClient } from "react-query";
import { useQueryClient } from "react-query";

import { useAptosAPI } from "./hooks.js";
import { makeAccountQueryKey } from "./useAccount.js";
import {
  makeAllResourcesQueryKey,
  makeResourceQueryKey,
} from "./useResource.js";

const applyWritesToCache = (
  nodeUrl: string,
  client: QueryClient,
  writes: WriteResource[]
) => {
  writes.forEach((change) => {
    client.setQueryData(
      makeResourceQueryKey(nodeUrl, change.address, change.data.type),
      change.data
    );
  });
  // apply writes
  Object.entries(groupBy(writes, (w) => w.address)).forEach(
    ([address, writes]) => {
      client.setQueryData(
        makeAllResourcesQueryKey(nodeUrl, address),
        (current: AccountResource[] | null | undefined): AccountResource[] => {
          if (!current) {
            return writes.map((w) => w.data);
          }
          const byType = keyBy(writes, (w) => w.data.type);
          const existing = new Set([...current.map((v) => v.type)]);
          const newValues = writes
            .map((w) => w.data)
            .filter((d) => !existing.has(d.type));
          return [
            ...current.map((v) => {
              return byType[v.type]?.data ?? v;
            }),
            ...newValues,
          ];
        }
      );
    }
  );
};

const applyDeletesToCache = (
  nodeUrl: string,
  client: QueryClient,
  deletes: DeleteResource[]
) => {
  deletes.forEach((change) => {
    client.setQueryData(
      makeResourceQueryKey(nodeUrl, change.address, change.resource),
      null
    );
  });
  // apply deletes
  Object.entries(groupBy(deletes, (w) => w.address)).forEach(
    ([address, deletes]) => {
      client.setQueryData(
        makeAllResourcesQueryKey(nodeUrl, address),
        (
          values: AccountResource[] | null | undefined
        ): AccountResource[] | null => {
          if (!values) {
            return null;
          }
          const byType = keyBy(deletes, (w) => w.resource);
          // delete all resources
          return values.filter((v) => {
            return !(v.type in byType);
          });
        }
      );
    }
  );
};

/**
 * Applies a series of {@link WriteSetChange}s to the query cache.
 * @param nodeUrl
 * @param client
 * @param changes
 */
export const applyWriteSetChangesToCache = (
  nodeUrl: string,
  client: QueryClient,
  changes: readonly WriteSetChange[]
): void => {
  const writes = changes.filter(
    (c): c is WriteResource => c.type === "write_resource"
  );
  const deletes = changes.filter(
    (c): c is DeleteResource => c.type === "delete_resource"
  );
  applyWritesToCache(nodeUrl, client, writes);
  applyDeletesToCache(nodeUrl, client, deletes);
};

/**
 * Applies a {@link UserTransaction} to the cache.
 * @param nodeUrl
 * @param client
 * @param changes
 */
export const applyUserTransactionToCache = (
  nodeUrl: string,
  client: QueryClient,
  tx: UserTransaction
): void => {
  client.setQueryData(
    makeAccountQueryKey(nodeUrl, HexString.ensure(tx.sender).checksum()),
    (data: Account | null | undefined): Account | null => {
      if (data) {
        data.sequence_number = Math.max(
          // increment sequence number
          parseInt(tx.sequence_number) + 1,
          parseInt(data.sequence_number)
        ).toString();
        return data;
      }
      // TODO(igm): figure out how to update the account if it was never fetched
      return null;
    }
  );
  applyWriteSetChangesToCache(nodeUrl, client, tx.changes);
};

/**
 * Applies a {@link UserTransaction}'s updates to the cache.
 * @returns
 */
export const useApplyUserTransactionToCache = (): ((
  tx: UserTransaction
) => void) => {
  const client = useQueryClient();
  const aptosAPI = useAptosAPI();
  return useCallback(
    (tx: UserTransaction) => {
      applyUserTransactionToCache(aptosAPI.nodeUrl, client, tx);
    },
    [client, aptosAPI]
  );
};
