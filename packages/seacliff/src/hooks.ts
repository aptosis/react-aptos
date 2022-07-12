import type { AptosAPI } from "@movingco/aptos";
import type { AptosClient } from "aptos";

import { useSeacliff } from "./context.js";

export const useAptosClient = (): AptosClient => {
  return useSeacliff().aptos;
};

export const useAptosAPI = (): AptosAPI => {
  return useSeacliff().aptosAPI;
};
