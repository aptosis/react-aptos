import { APTOS_DEVNET_FULL_NODE_URL, createAptosClient } from "@movingco/aptos";

import { AptosAPI } from "./aptos.js";

const aptos = createAptosClient(APTOS_DEVNET_FULL_NODE_URL);
const aptosAPI = new AptosAPI(APTOS_DEVNET_FULL_NODE_URL);

export const useAptosClient = () => {
  return aptos;
};

export const useAptosAPI = () => {
  return aptosAPI;
};
