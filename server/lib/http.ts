import { HTTP_TIMEOUT_MS } from '../../shared/constants/cache.ts';

export interface FetchOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T | null> {
  const { timeout = HTTP_TIMEOUT_MS, headers = {} } = options;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);

    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    clearTimeout(t);

    if (!res.ok) {
      console.warn(`[fetchJson] ${url} returned ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[fetchJson] Failed to fetch ${url}:`, err);
    return null;
  }
}
