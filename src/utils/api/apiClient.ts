import { APIRequestContext, APIResponse, test } from '@playwright/test';

export type QueryParams = Record<string, string | number | boolean>;
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestSpec {
  headers?: Record<string, string>;
  params?: QueryParams;
  /** Object (serialised as JSON) or a raw string (e.g. deliberately malformed JSON). */
  data?: unknown;
}

/**
 * Replaces PWAPIUtils + the request/response attachment code that every Java *ApiTestUtils repeated.
 * One instance per test (created by the fixtures), never static.
 * Every call is wrapped in test.step and attaches masked request details and a pretty-printed response.
 */
export class ApiClient {
  constructor(
    private readonly context: APIRequestContext,
    private readonly baseUrl: string,
  ) {}

  get(path: string, spec: RequestSpec = {}): Promise<APIResponse> {
    return this.send('GET', path, spec);
  }
  post(path: string, spec: RequestSpec = {}): Promise<APIResponse> {
    return this.send('POST', path, spec);
  }
  put(path: string, spec: RequestSpec = {}): Promise<APIResponse> {
    return this.send('PUT', path, spec);
  }
  patch(path: string, spec: RequestSpec = {}): Promise<APIResponse> {
    return this.send('PATCH', path, spec);
  }
  delete(path: string, spec: RequestSpec = {}): Promise<APIResponse> {
    return this.send('DELETE', path, spec);
  }

  /** Path segments must be encoded as a single segment (spaces -> %20), like Java's encodePathSegment. */
  static encodePathSegment(raw: string): string {
    return encodeURIComponent(raw);
  }

  private async send(method: HttpMethod, path: string, spec: RequestSpec): Promise<APIResponse> {
    return test.step(`${method} ${path}`, async () => {
      const headers = { ...(spec.headers ?? {}) };
      // Playwright sends non-object bodies as octet-stream unless told otherwise.
      const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
      if (spec.data !== undefined && !hasContentType) {
        headers['Content-Type'] = 'application/json';
      }

      await this.attachRequest(method, path, headers, spec);
      const response = await this.context.fetch(path, {
        method,
        headers,
        params: spec.params,
        data: spec.data as never,
      });
      await this.attachResponse(response);
      return response;
    });
  }

  private async attachRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    spec: RequestSpec,
  ): Promise<void> {
    const info = test.info();
    const details = {
      url: `${this.baseUrl}${path}`,
      method,
      params: spec.params ?? {},
      headers: ApiClient.maskAuth(headers),
      body: spec.data ?? null,
    };
    await info.attach('Request', {
      body: JSON.stringify(details, null, 2),
      contentType: 'application/json',
    });
  }

  private async attachResponse(response: APIResponse): Promise<void> {
    const info = test.info();
    const text = await response.text();
    await info.attach(`Response ${response.status()}`, {
      body: ApiClient.prettyJson(text),
      contentType: 'application/json',
    });
  }

  static prettyJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  private static maskAuth(headers: Record<string, string>): Record<string, string> {
    const masked = { ...headers };
    for (const key of Object.keys(masked)) {
      if (key.toLowerCase() === 'authorization') {
        masked[key] = 'Bearer ***';
      }
    }
    return masked;
  }
}
