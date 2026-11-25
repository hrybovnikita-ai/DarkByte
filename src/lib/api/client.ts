export type ApiListResponse<T> = {
  success: boolean;
  data: T[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ApiItemResponse<T> = {
  success: boolean;
  data: T;
};

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const headers: HeadersInit = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(path, { headers, cache: "no-store" });
  const body = (await response.json()) as ApiItemResponse<T> & {
    error?: { message: string };
  };
  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? `Request failed (${response.status})`);
  }
  return body.data;
}

export async function apiGetList<T>(
  path: string,
  token?: string | null,
): Promise<ApiListResponse<T>> {
  const headers: HeadersInit = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(path, { headers, cache: "no-store" });
  return (await response.json()) as ApiListResponse<T>;
}