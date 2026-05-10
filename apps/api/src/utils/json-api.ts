import { z } from "zod";

export interface JsonApiResource<TAttrs, TType extends string = string, TRels = unknown> {
  type: TType;
  id: string;
  attributes: TAttrs;
  relationships: TRels;
}

export interface JsonApiSingle<TAttrs, TType extends string = string, TRels = unknown> {
  data: JsonApiResource<TAttrs, TType, TRels>;
}

export interface JsonApiPagination {
  total: number;
  page: number;
  pageSize: number;
}

export interface JsonApiLinks {
  self: string;
  next: string | null;
  prev: string | null;
}

export interface JsonApiCollection<TData> {
  data: TData[];
  meta: JsonApiPagination;
  links: JsonApiLinks;
}

export interface JsonApiResourceLike {
  type: string;
  id: string;
}

export interface JsonApiCollectionWithIncluded<TData, TIncluded> {
  data: TData[];
  included: TIncluded[];
  meta: JsonApiPagination;
  links: JsonApiLinks;
}

export interface JsonApiSingleWithIncluded<TData, TIncluded> {
  data: TData;
  included: TIncluded[];
}

export interface JsonApiError {
  status: string;
  code: string;
  title: string;
  detail?: string;
  source?: { pointer?: string; parameter?: string };
}

export interface JsonApiErrors {
  errors: JsonApiError[];
}

const buildPageUrl = (baseUrl: string, page: number): string => {
  try {
    const url = new URL(baseUrl);

    url.searchParams.set("page", String(page));

    return url.toString();
  } catch {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const stripped = baseUrl.replace(/([?&])page=[^&]*(&|$)/, (_m, p1, p2) => (p2 === "&" ? p1 : ""));
    const cleaned = stripped.endsWith("?") || stripped.endsWith("&") ? stripped.slice(0, -1) : stripped;

    return `${cleaned}${sep}page=${page}`;
  }
};

export const buildCollection = <T, D>(
  items: T[],
  pagination: JsonApiPagination,
  baseUrl: string,
  toData: (item: T) => D,
): JsonApiCollection<D> => {
  const hasNext = pagination.page * pagination.pageSize < pagination.total;
  const hasPrev = pagination.page > 1;

  return {
    data: items.map(toData),
    meta: pagination,
    links: {
      self: baseUrl,
      next: hasNext ? buildPageUrl(baseUrl, pagination.page + 1) : null,
      prev: hasPrev ? buildPageUrl(baseUrl, pagination.page - 1) : null,
    },
  };
};

export const dedupeIncluded = <T extends JsonApiResourceLike>(items: T[]): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const item of items) {
    const key = `${item.type}:${item.id}`;

    if (seen.has(key)) continue;

    seen.add(key);
    out.push(item);
  }

  return out;
};

export const buildCollectionWithIncluded = <T, D, I extends JsonApiResourceLike>(
  items: T[],
  included: I[],
  pagination: JsonApiPagination,
  baseUrl: string,
  toData: (item: T) => D,
): JsonApiCollectionWithIncluded<D, I> => {
  const hasNext = pagination.page * pagination.pageSize < pagination.total;
  const hasPrev = pagination.page > 1;

  return {
    data: items.map(toData),
    included: dedupeIncluded(included),
    meta: pagination,
    links: {
      self: baseUrl,
      next: hasNext ? buildPageUrl(baseUrl, pagination.page + 1) : null,
      prev: hasPrev ? buildPageUrl(baseUrl, pagination.page - 1) : null,
    },
  };
};

export const buildSingleWithIncluded = <D, I extends JsonApiResourceLike>(
  data: D,
  included: I[],
): JsonApiSingleWithIncluded<D, I> => ({
  data,
  included: dedupeIncluded(included),
});

export const errorsBody = (errors: JsonApiError[]): JsonApiErrors => ({ errors });

export const jsonApiSingleSchema = <S extends z.ZodTypeAny>(dataSchema: S) => z.object({ data: dataSchema });

export const jsonApiCollectionSchema = <S extends z.ZodTypeAny>(dataSchema: S) =>
  z.object({
    data: z.array(dataSchema),
    meta: z.object({
      total: z.number().int().nonnegative(),
      page: z.number().int().min(1),
      pageSize: z.number().int().min(1),
    }),
    links: z.object({
      self: z.string(),
      next: z.string().nullable(),
      prev: z.string().nullable(),
    }),
  });

export const jsonApiCollectionWithIncludedSchema = <S extends z.ZodTypeAny, I extends z.ZodTypeAny>(
  dataSchema: S,
  includedSchema: I,
) =>
  z.object({
    data: z.array(dataSchema),
    included: z.array(includedSchema),
    meta: z.object({
      total: z.number().int().nonnegative(),
      page: z.number().int().min(1),
      pageSize: z.number().int().min(1),
    }),
    links: z.object({
      self: z.string(),
      next: z.string().nullable(),
      prev: z.string().nullable(),
    }),
  });

export const jsonApiSingleWithIncludedSchema = <S extends z.ZodTypeAny, I extends z.ZodTypeAny>(
  dataSchema: S,
  includedSchema: I,
) =>
  z.object({
    data: dataSchema,
    included: z.array(includedSchema),
  });

export const jsonApiErrorsSchema = z.object({
  errors: z.array(
    z.object({
      status: z.string(),
      code: z.string(),
      title: z.string(),
      detail: z.string().optional(),
      source: z
        .object({
          pointer: z.string().optional(),
          parameter: z.string().optional(),
        })
        .optional(),
    }),
  ),
});
