import type { JsonApiError } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: JsonApiError[];

  constructor(status: number, code: string, message: string, errors: JsonApiError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isNotFound(): boolean {
    return this.status === 404;
  }
}
