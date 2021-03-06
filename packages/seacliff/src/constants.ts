export const RESOURCE_QUERY_PREFIX = "react-aptos/resource";
export const ALL_RESOURCES_QUERY_PREFIX = "react-aptos/allResources";
export const ACCOUNT_QUERY_PREFIX = "react-aptos/account";

export type AptosAPIQueryType =
  | typeof RESOURCE_QUERY_PREFIX
  | typeof ALL_RESOURCES_QUERY_PREFIX
  | typeof ACCOUNT_QUERY_PREFIX;
