import type {
  AccountResource,
  DeleteResource,
  WriteResource,
  WriteSetChange,
} from "@movingco/aptos-api";
import { default as groupBy } from "lodash.groupby";
import { default as keyBy } from "lodash.keyby";
import type { QueryClient } from "react-query";

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
        (
          values: AccountResource[] | null | undefined
        ): AccountResource[] | null => {
          if (!values) {
            return writes.map((w) => w.data);
          }
          const byType = keyBy(writes, (w) => w.data.type);
          return values.map((v) => {
            return byType[v.type]?.data ?? v;
          });
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
  changes: WriteSetChange[]
) => {
  const writes = changes.filter(
    (c): c is WriteResource => c.type === "write_resource"
  );
  const deletes = changes.filter(
    (c): c is DeleteResource => c.type === "delete_resource"
  );
  applyWritesToCache(nodeUrl, client, writes);
  applyDeletesToCache(nodeUrl, client, deletes);
};
