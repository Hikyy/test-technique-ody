import type { Context, ValidationTargets } from "hono";
import { validator as honoValidator } from "hono-openapi/zod";
import type { ZodSchema } from "zod";

const formatZodErrors = (err: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined>; formErrors: string[] };
}): { errors: unknown[] } => {
  const flat = err.flatten();
  const errors = [
    ...Object.entries(flat.fieldErrors).flatMap(([field, msgs]) =>
      (msgs ?? []).map((m) => ({
        status: "400",
        code: "VALIDATION_ERROR",
        title: "Validation failed",
        detail: m,
        source: { pointer: `/${field.replace(/\./g, "/")}` },
      })),
    ),
    ...flat.formErrors.map((m) => ({
      status: "400",
      code: "VALIDATION_ERROR",
      title: "Validation failed",
      detail: m,
    })),
  ];

  return { errors };
};

export const zv = <T extends ZodSchema, K extends keyof ValidationTargets>(target: K, schema: T) =>
  honoValidator(target, schema, (result, c: Context) => {
    if (!result.success) {
      return c.json(formatZodErrors(result.error), 400);
    }

    return undefined;
  });
