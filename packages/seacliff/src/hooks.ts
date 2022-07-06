import { useSeacliff } from "./context.js";

export const useAptosClient = () => {
  return useSeacliff().aptos;
};

export const useAptosAPI = () => {
  return useSeacliff().aptosAPI;
};
