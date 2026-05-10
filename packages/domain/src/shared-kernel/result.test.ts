import { describe, expect, it } from "vitest";
import { all, andThen, Err, isErr, isOk, map, mapErr, Ok, unwrapOr } from "./result.js";

describe("Result", () => {
  it("Ok constructs success", () => {
    const r = Ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it("Err constructs failure", () => {
    const r = Err("boom");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("boom");
  });

  it("isOk / isErr discriminate correctly", () => {
    expect(isOk(Ok(1))).toBe(true);
    expect(isOk(Err("x"))).toBe(false);
    expect(isErr(Err("x"))).toBe(true);
    expect(isErr(Ok(1))).toBe(false);
  });

  it("map transforms Ok value", () => {
    const r = map(Ok(2), (n) => n * 10);
    expect(r).toEqual(Ok(20));
  });

  it("map leaves Err untouched", () => {
    const r = map(Err<string>("bad"), (n: number) => n * 10);
    expect(r).toEqual(Err("bad"));
  });

  it("mapErr transforms Err value", () => {
    const r = mapErr(Err("bad"), (e) => `wrapped:${e}`);
    expect(r).toEqual(Err("wrapped:bad"));
  });

  it("mapErr leaves Ok untouched", () => {
    const r = mapErr(Ok(1), (e: string) => e.toUpperCase());
    expect(r).toEqual(Ok(1));
  });

  it("andThen chains success", () => {
    const r = andThen(Ok(2), (n) => Ok(n + 1));
    expect(r).toEqual(Ok(3));
  });

  it("andThen short-circuits on Err", () => {
    const r = andThen(Err<string>("e"), (n: number) => Ok(n + 1));
    expect(r).toEqual(Err("e"));
  });

  it("andThen propagates inner Err", () => {
    const r = andThen(Ok(2), (_n) => Err("inner"));
    expect(r).toEqual(Err("inner"));
  });

  it("all returns Ok of array when all Ok", () => {
    const r = all([Ok(1), Ok(2), Ok(3)]);
    expect(r).toEqual(Ok([1, 2, 3]));
  });

  it("all returns first Err encountered", () => {
    const r = all<number, string>([Ok(1), Err("e1"), Err("e2")]);
    expect(r).toEqual(Err("e1"));
  });

  it("all on empty array returns Ok([])", () => {
    expect(all([])).toEqual(Ok([]));
  });

  it("unwrapOr returns value when Ok", () => {
    expect(unwrapOr(Ok(5), 0)).toBe(5);
  });

  it("unwrapOr returns fallback when Err", () => {
    expect(unwrapOr(Err<string>("x") as never, 99)).toBe(99);
  });
});
