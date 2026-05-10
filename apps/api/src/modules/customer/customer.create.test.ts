import { Customer, type CustomerRepository, createCustomer } from "@ody/domain/customer";
import { ConflictError, Err, Ok } from "@ody/domain/shared-kernel";
import { describe, expect, it, vi } from "vitest";

const TENANT = "00000000-0000-4000-8000-0000000000bb";

const fakeRepo = (overrides: Partial<CustomerRepository> = {}): CustomerRepository => ({
  findById: vi.fn().mockResolvedValue(Ok(null)),
  findByIds: vi.fn().mockResolvedValue(Ok([])),
  list: vi.fn().mockResolvedValue(Ok({ items: [], total: 0, page: 1, pageSize: 20 })),
  save: vi.fn().mockResolvedValue(Ok(undefined)),
  delete: vi.fn().mockResolvedValue(Ok(undefined)),
  ...overrides,
});

describe("createCustomer use case", () => {
  it("returns Ok and persists the customer on happy path", async () => {
    const customers = fakeRepo();
    const r = await createCustomer(
      { organizationId: TENANT, data: { first_name: "Léa", last_name: "Dupont", email: "lea@seve.fr" } },
      { customers },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBeInstanceOf(Customer);
      expect(r.value.firstName).toBe("Léa");
      expect(r.value.email?.value).toBe("lea@seve.fr");
      expect(r.value.spent.cents).toBe(0);
    }
    expect(customers.save).toHaveBeenCalledOnce();
    const call = vi.mocked(customers.save).mock.calls[0];
    expect(call?.[0]).toBe(TENANT);
    expect(call?.[1]).toBeInstanceOf(Customer);
  });

  it("returns Err when neither email nor phone is provided", async () => {
    const customers = fakeRepo();
    const r = await createCustomer(
      { organizationId: TENANT, data: { first_name: "Léa", last_name: "Dupont" } },
      { customers },
    );
    expect(r.ok).toBe(false);
    expect(customers.save).not.toHaveBeenCalled();
  });

  it("returns Err on invalid email", async () => {
    const customers = fakeRepo();
    const r = await createCustomer(
      { organizationId: TENANT, data: { first_name: "Léa", last_name: "Dupont", email: "not-an-email" } },
      { customers },
    );
    expect(r.ok).toBe(false);
    expect(customers.save).not.toHaveBeenCalled();
  });

  it("propagates ConflictError from repository.save", async () => {
    const customers = fakeRepo({
      save: vi.fn().mockResolvedValue(Err(new ConflictError("email already taken"))),
    });
    const r = await createCustomer(
      { organizationId: TENANT, data: { first_name: "Léa", last_name: "Dupont", email: "lea@seve.fr" } },
      { customers },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ConflictError);
  });

  it("accepts a phone-only customer and normalizes E.164", async () => {
    const customers = fakeRepo();
    const r = await createCustomer(
      { organizationId: TENANT, data: { first_name: "Léa", last_name: "Dupont", phone: "06 12 34 56 78" } },
      { customers },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.phone?.value).toBe("+33612345678");
  });
});
