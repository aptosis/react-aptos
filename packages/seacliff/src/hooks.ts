import type { AptosAPI } from "@aptosis/aptos-client";

import { useSeacliff } from "./context.js";

export const useAptosAPI = (): AptosAPI => {
  return useSeacliff().aptosAPI;
};
