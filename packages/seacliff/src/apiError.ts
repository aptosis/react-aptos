import type { AptosError } from "@movingco/aptos-api";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

type Request = { host?: string; path?: string };

export class RequestError extends Error {
  response?: AxiosResponse<unknown, AptosError>;

  requestBody?: string;

  constructor(
    response: AxiosResponse<unknown, AptosError>,
    requestBody?: string
  ) {
    const message = response.statusText;
    const data = JSON.stringify(response.data);

    const hostAndPath = [
      (response.request as Request)?.host,
      (response.request as Request)?.path,
    ]
      .filter((e) => !!e)
      .join("");
    super(
      `${message} - ${data}${hostAndPath ? ` @ ${hostAndPath}` : ""}${
        requestBody ? ` : ${requestBody}` : ""
      }`
    );
    this.response = response;
    this.requestBody = requestBody;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

export type AptosClientConfig = Omit<
  AxiosRequestConfig,
  "data" | "cancelToken" | "method"
>;

export function raiseForStatus<T>(
  expectedStatus: number,
  response: AxiosResponse<T, AptosError>,
  requestContent?: unknown
): void {
  if (response.status !== expectedStatus) {
    if (requestContent) {
      throw new RequestError(response, JSON.stringify(requestContent));
    }
    throw new RequestError(response);
  }
}
