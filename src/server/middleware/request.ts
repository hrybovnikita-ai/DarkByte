const MAX_BYTES = Number(process.env.API_MAX_BODY_BYTES ?? 1_048_576);

export async function readJsonBody(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_BYTES) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }
  const text = await request.text();
  if (text.length > MAX_BYTES) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function applyApiGuards(request: Request) {
  if (request.method === "OPTIONS") {
    return null;
  }
  return request;
}