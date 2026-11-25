import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorBody = {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export type ApiSuccessBody<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export function apiSuccess<T>(
  data: T,
  init?: { status?: number; meta?: Record<string, unknown> },
) {
  const body: ApiSuccessBody<T> = {
    success: true,
    data,
    ...(init?.meta ? { meta: init.meta } : {}),
  };
  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function apiCreated<T>(data: T) {
  return apiSuccess(data, { status: 201 });
}

export function apiConflict(message: string) {
  return apiError(message, 409, "CONFLICT");
}

export function apiNoContent() {
  return new NextResponse(null, { status: 204 });
}

export function apiError(
  message: string,
  status: number,
  code?: string,
  details?: unknown,
) {
  const body: ApiErrorBody = {
    success: false,
    error: { message, ...(code ? { code } : {}), ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
  }
  if (error instanceof Error) {
    if (error.message === "DATABASE_NOT_CONFIGURED") {
      return apiError(
        "Database is not configured. Set DATABASE_URL and run migrations.",
        503,
        "DATABASE_NOT_CONFIGURED",
      );
    }
    if (error.message === "UNAUTHORIZED") {
      return apiError("Authentication required", 401, "UNAUTHORIZED");
    }
    if (error.message === "FORBIDDEN") {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }
    if (error.message === "NOT_FOUND") {
      return apiError("Resource not found", 404, "NOT_FOUND");
    }
    if (error.message === "CONFLICT") {
      return apiError("Resource conflict", 409, "CONFLICT");
    }
  }
  return apiError("Internal server error", 500, "INTERNAL_ERROR");
}