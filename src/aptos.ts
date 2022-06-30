import { Accounts, HttpClient, Transactions } from "@movingco/aptos-api";
import { default as fetchAdapter } from "@vespaiach/axios-fetch-adapter";
import type { AxiosRequestConfig } from "axios";

export type APIClientConfig = Omit<
  AxiosRequestConfig,
  "data" | "cancelToken" | "method"
>;

export class AptosAPI {
  readonly client: HttpClient;

  readonly accounts: Accounts;
  readonly transactions: Transactions;

  constructor(readonly nodeUrl: string, config: APIClientConfig = {}) {
    // `withCredentials` ensures cookie handling
    this.client = new HttpClient({
      withCredentials: false,
      baseURL: nodeUrl,
      validateStatus: () => true, // Don't explode here on error responses; let our code handle it
      adapter: fetchAdapter,
      ...config,
    });

    this.accounts = new Accounts(this.client);
    this.transactions = new Transactions(this.client);
  }
}
