/**
 * Resilient API client utilities for CloudOps & K8s Platform
 * Guarantees graceful error handling, prevents HTML parsing crashes,
 * and handles temporary network/server warm-up states.
 */

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  fallback: T | null = null
): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return fallback;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return fallback;
    }
    const data = await res.json();
    return data as T;
  } catch (err) {
    // Network or abort error during initial server spin-up or sleep
    return fallback;
  }
}

export async function safePostJson<T = any>(
  url: string,
  body: any,
  fallback: T | null = null
): Promise<T | null> {
  return safeFetchJson<T>(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    fallback
  );
}
