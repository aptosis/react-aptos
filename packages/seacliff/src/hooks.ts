import type { AptosAPI } from "@aptosis/aptos-client";
import type { AptosClient } from "aptos";

import { useSeacliff } from "./context.js";

export const useAptosClient = (): AptosClient => {
  return useSeacliff().aptos;
};

export const useAptosAPI = (): AptosAPI => {
  return useSeacliff().aptosAPI;
};
