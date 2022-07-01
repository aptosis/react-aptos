import type {
  AccountResource,
  UserTransaction,
  WriteResource,
} from "@movingco/aptos-api";
import { default as groupBy } from "lodash.groupby";
import { default as keyBy } from "lodash.keyby";
import { useCallback } from "react";
import { useQueryClient } from "react-query";

import { useAptosAPI } from "../hooks.js";
import {
  makeAllResourcesQueryKey,
  makeResourceQueryKey,
} from "../query/useResource.js";

export const useHandleTXSuccess = () => {
  const client = useQueryClient();
  const aptosAPI = useAptosAPI();
  return useCallback(
    (data: UserTransaction) => {
      // the data is in the response, so updates should be relatively
      // easier to display
      const writes = data.changes.filter(
        (c): c is WriteResource => c.type === "write_resource"
      );
      writes.forEach((change) => {
        client.setQueryData(
          makeResourceQueryKey(
            aptosAPI.nodeUrl,
            change.address,
            change.data.type
          ),
          change.data
        );
      });
      Object.entries(groupBy(writes, (w) => w.address)).forEach(
        ([address, writes]) => {
          client.setQueryData(
            makeAllResourcesQueryKey(address),
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
    },
    [aptosAPI.nodeUrl, client]
  );
};
