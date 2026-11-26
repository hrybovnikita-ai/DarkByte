/** Same-origin authenticated API requests (session cookies). */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    credentials: init?.credentials ?? "include",
  });
}