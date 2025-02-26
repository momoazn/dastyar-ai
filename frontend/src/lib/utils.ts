import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const detectTextDirection = (text: string): "rtl" | "ltr" => {
  const rtlRegex =
    /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text) ? "rtl" : "ltr";
};

type Fetch = typeof fetch;

interface ErrorResponse {
  error: string;
}

interface Config {
  host: string;
  fetch?: Fetch;
  proxy?: boolean;
  headers?: HeadersInit;
}

export class StreamResponseService {
  protected readonly config: Config;
  protected readonly fetch: Fetch;
  protected readonly ongoingStreamedRequests: AbortableAsyncIterator<object>[] =
    [];

  constructor(config?: Partial<Config>) {
    this.config = {
      host: "",
      headers: config?.headers,
    };

    this.fetch = config?.fetch ?? fetch;
  }

  // Abort any ongoing streamed requests to Ollama
  public abort() {
    for (const request of this.ongoingStreamedRequests) {
      request.abort();
    }
    this.ongoingStreamedRequests.length = 0;
  }

  /**
   * Processes a request to the Ollama server. If the request is streamable, it will return a
   * AbortableAsyncIterator that yields the response messages. Otherwise, it will return the response
   * object.
   * @param endpoint {string} - The endpoint to send the request to.
   * @param request {object} - The request object to send to the endpoint.
   * @protected {T | AbortableAsyncIterator<T>} - The response object or a AbortableAsyncIterator that yields
   * response messages.
   * @throws {Error} - If the response body is missing or if the response is an error.
   * @returns {Promise<T | AbortableAsyncIterator<T>>} - The response object or a AbortableAsyncIterator that yields the streamed response.
   */
  async processStreamableRequest<T extends object>(
    endpoint: string,
    request: { stream?: boolean } & Record<string, any>,
  ): Promise<AbortableAsyncIterator<T>> {
    request.stream = request.stream ?? false;
    const host = `/api/${endpoint}`;
    if (request.stream) {
      const abortController = new AbortController();
      const response = await this.post(this.fetch, host, request, {
        signal: abortController.signal,
        headers: this.config.headers,
      });

      if (!response.body) {
        throw new Error("Missing body");
      }

      const itr = this.parseJSON<T | ErrorResponse>(response.body);
      const abortableAsyncIterator = new AbortableAsyncIterator(
        abortController,
        itr,
        () => {
          const i = this.ongoingStreamedRequests.indexOf(
            abortableAsyncIterator,
          );
          if (i > -1) {
            this.ongoingStreamedRequests.splice(i, 1);
          }
        },
      );
      this.ongoingStreamedRequests.push(abortableAsyncIterator);
      return abortableAsyncIterator;
    }
    const response = await this.post(this.fetch, host, request, {
      headers: this.config.headers,
    });
    return await response.json();
  }

  /**
   * A wrapper around the post method that adds default headers.
   * @param fetch {Fetch} - The fetch function to use
   * @param host {string} - The host to fetch
   * @param data {Record<string, unknown> | BodyInit} - The data to send
   * @param options {{ signal: AbortSignal }} - The fetch options
   * @returns {Promise<Response>} - The fetch response
   */
  post = async (
    fetch: Fetch,
    host: string,
    data?: Record<string, unknown> | BodyInit,
    options?: { signal?: AbortSignal; headers?: HeadersInit },
  ): Promise<Response> => {
    const isRecord = (input: any): input is Record<string, unknown> => {
      return (
        input !== null && typeof input === "object" && !Array.isArray(input)
      );
    };

    const formattedData = isRecord(data) ? JSON.stringify(data) : data;

    const response = await this.fetchWithHeaders(fetch, host, {
      method: "POST",
      body: formattedData,
      signal: options?.signal,
      headers: options?.headers,
    });

    await this.checkOk(response);

    return response;
  };

  /**
   * A wrapper around fetch that adds default headers.
   * @param fetch {Fetch} - The fetch function to use
   * @param url {string} - The URL to fetch
   * @param options {RequestInit} - The fetch options
   * @returns {Promise<Response>} - The fetch response
   */
  async fetchWithHeaders(
    fetch: Fetch,
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    } as HeadersInit;

    if (!options.headers) {
      options.headers = {};
    }

    // Filter out default headers from custom headers
    const customHeaders = Object.fromEntries(
      Object.entries(options.headers).filter(
        ([key]) =>
          !Object.keys(defaultHeaders).some(
            (defaultKey) => defaultKey.toLowerCase() === key.toLowerCase(),
          ),
      ),
    );

    options.headers = {
      ...defaultHeaders,
      ...customHeaders,
    };

    return fetch(url, options);
  }

  /**
   * Checks if the response is ok, if not throws an error.
   * If the response is not ok, it will try to parse the response as JSON and use the error field as the error message.
   * @param response {Response} - The response object to check
   */
  async checkOk(response: Response): Promise<void> {
    if (response.ok) {
      return;
    }
    let message = `Error ${response.status}: ${response.statusText}`;
    let errorData: ErrorResponse | null = null;

    if (response.headers.get("content-type")?.includes("application/json")) {
      try {
        errorData = (await response.json()) as ErrorResponse;
        message = errorData.error || message;
      } catch (error) {
        console.log("Failed to parse error response as JSON");
      }
    } else {
      try {
        console.log("Getting text from response");
        const textResponse = await response.text();
        message = textResponse || message;
      } catch (error) {
        console.log("Failed to get text from error response");
      }
    }

    throw new ResponseError(message, response.status);
  }

  /**
   * Parses a ReadableStream of Uint8Array into JSON objects.
   * @param itr {ReadableStream<Uint8Array>} - The stream to parse
   * @returns {AsyncGenerator<T>} - The parsed JSON objects
   */
  parseJSON = async function* <T = unknown>(
    itr: ReadableStream<Uint8Array>,
  ): AsyncGenerator<T> {
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const reader = itr.getReader();

    while (true) {
      const { done, value: chunk } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(chunk);

      const parts = buffer.split("\n");

      buffer = parts.pop() ?? "";

      for (const part of parts) {
        try {
          yield JSON.parse(part);
        } catch (error) {
          console.warn("invalid json: ", part);
        }
      }
    }

    for (const part of buffer.split("\n").filter((p) => p !== "")) {
      try {
        yield JSON.parse(part);
      } catch (error) {
        console.warn("invalid json: ", part);
      }
    }
  };
}

/**
 * An error class for response errors.
 * @extends Error
 */
class ResponseError extends Error {
  constructor(
    public error: string,
    public status_code: number,
  ) {
    super(error);
    this.name = "ResponseError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResponseError);
    }
  }
}

/**
 * An AsyncIterator which can be aborted
 */
export class AbortableAsyncIterator<T extends object> {
  private readonly abortController: AbortController;
  private readonly itr: AsyncGenerator<T | ErrorResponse>;
  private readonly doneCallback: () => void;

  constructor(
    abortController: AbortController,
    itr: AsyncGenerator<T | ErrorResponse>,
    doneCallback: () => void,
  ) {
    this.abortController = abortController;
    this.itr = itr;
    this.doneCallback = doneCallback;
  }

  abort() {
    this.abortController.abort();
  }

  async *[Symbol.asyncIterator]() {
    for await (const message of this.itr) {
      if ("error" in message) {
        throw new Error(message.error);
      }
      yield message;
      // message will be done in the case of chat and generate
      // message will be success in the case of a progress response (pull, push, create)
      if ((message as any).done || (message as any).status === "success") {
        this.doneCallback();
        return;
      }
    }
    throw new Error("Did not receive done or success response in stream.");
  }
}
