import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { ControllerSpec } from "../../utils/controller.js";
import { errorsBody } from "../../utils/json-api.js";
import { storeImage, UploadValidationError } from "./storage.js";

const uploadResponseSchema = z.object({
  type: z.literal("uploads"),
  id: z.string(),
  attributes: z.object({
    url: z.string(),
    mime: z.string(),
    bytes: z.number().int().nonnegative(),
  }),
});

export const UploadDishImageController = {
  tag: "uploads",
  summary: "Upload a dish image (multipart/form-data, field: file)",
  errorSet: "minimal",
  response: { single: uploadResponseSchema, status: 201, description: "Stored" },

  async __invoke({ context }) {
    const form = await context.req.parseBody();
    const file = form.file;

    if (!(file instanceof File)) {
      throw new HTTPException(422, {
        res: context.json(errorsBody([{ status: "422", code: "VALIDATION", title: "Missing file field" }]), 422),
      });
    }

    try {
      const stored = await storeImage({ file, category: "dishes" });

      return {
        type: "uploads" as const,
        id: stored.url,
        attributes: stored,
      };
    } catch (e) {
      if (e instanceof UploadValidationError) {
        throw new HTTPException(422, {
          res: context.json(errorsBody([{ status: "422", code: e.code, title: e.message }]), 422),
        });
      }

      throw e;
    }
  },
} satisfies ControllerSpec;
