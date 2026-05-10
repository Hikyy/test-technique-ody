# @ody/types

Single source of truth for API types consumed by the front-end.

## Pattern

The backend (`apps/api`) is the only source of API types. This package
generates `src/generated.ts` from the live OpenAPI document built by the
Hono app, and re-exports ergonomic aliases from `src/index.ts`.

## Conventions

- Wire format: **JSON:API**
  - Single: `JsonApiSingle<T>` = `{ data: T }`
  - Collection: `JsonApiCollection<T>` = `{ data: T[]; meta: { total, page, pageSize }; links: { self, next, prev } }`
  - Errors: `JsonApiErrors` = `{ errors: JsonApiError[] }`
- Naming split:
  - **`...Data`** = response payload (e.g. `OrderData`, `CustomerData`, `DishData`)
  - **`...DTO`** = input payload (e.g. `CreateOrderDTO`, `UpdateCustomerDTO`, `ListOrdersFiltersDTO`)

## Regenerate

```sh
pnpm gen:types
```

## Rule

The front-end MUST NOT redeclare any type that mirrors an API payload.
Import everything from `@ody/types`. If a type is missing, add an alias
here — never inline it.

## TODO

The current API does **not** yet emit JSON:API envelopes. Aliases like
`OrderData` will be inaccurate until the API is rewritten. Re-run
`pnpm gen:types` after the backend JSON:API rewrite — no consumer change
needed, only the regenerated `generated.ts` shifts under the aliases.
