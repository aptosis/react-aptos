import { useAptosConnection } from "./index.js";

export const useAptosClient = () => {
  return useAptosConnection().aptos;
};

export const useAptosAPI = () => {
  return useAptosConnection().aptosAPI;
};
