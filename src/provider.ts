import { useAptos } from "./context.js";

export const useAptosClient = () => {
  return useAptos().aptos;
};

export const useAptosAPI = () => {
  return useAptos().aptosAPI;
};
