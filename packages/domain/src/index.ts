export * as Catalog from "./catalog/index.js";
export * as Customer from "./customer/index.js";
export * as Identity from "./identity/index.js";
export * as Ordering from "./ordering/index.js";
export * as Restaurant from "./restaurant/index.js";
export {
  ConflictError,
  DomainError,
  InvalidTransitionError,
  InvariantViolation,
  NotFoundError,
  ValidationError,
} from "./shared-kernel/errors.js";
export * as SharedKernel from "./shared-kernel/index.js";
// Convenience flat re-exports for the most common shared primitives.
export {
  Err,
  isErr,
  isOk,
  Ok,
  type Result,
} from "./shared-kernel/result.js";
