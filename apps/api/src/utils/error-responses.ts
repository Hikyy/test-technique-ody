import { resolver } from "hono-openapi/zod";
import { jsonApiErrorsSchema } from "./json-api.js";

const errEntry = (description: string) => ({
  description,
  content: { "application/json": { schema: resolver(jsonApiErrorsSchema) } },
});

export const errorResponses = {
  204: { description: "No content" },
  400: errEntry("Validation"),
  401: errEntry("Unauthenticated"),
  403: errEntry("Forbidden"),
  404: errEntry("Not found"),
  409: errEntry("Conflict"),
  422: errEntry("Invariant"),
  500: errEntry("Internal"),
} as const;

export const errorEntry = errEntry;
