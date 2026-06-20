import { HTTP_TIMEOUT_MS } from '../../shared/constants/cache.ts';

export async function fetchJson<T>(url: string, timeout = HTTP_TIMEOUT_MS): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
