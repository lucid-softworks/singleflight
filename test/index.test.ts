import { describe, expect, it, vi } from "vitest";

import { Singleflight } from "../src/index.js";

describe("Singleflight", () => {
  it("shares concurrent work and removes fulfilled flights", async () => {
    let resolve!: (value: number) => void;
    const task = vi.fn<() => Promise<number>>(
      () => new Promise((done) => (resolve = done)),
    );
    const flights = new Singleflight<string>();
    const first = flights.do("key", task);
    const second = flights.do("key", task);
    await Promise.resolve();
    expect(flights.has("key")).toBe(true);
    expect(flights.size).toBe(1);
    expect(task).toHaveBeenCalledOnce();
    resolve(42);
    await expect(Promise.all([first, second])).resolves.toEqual([42, 42]);
    expect(flights.size).toBe(0);
  });

  it("removes rejected flights so later calls retry", async () => {
    const flights = new Singleflight<string>();
    await expect(
      flights.do("key", () => {
        throw new Error("failed");
      }),
    ).rejects.toThrow("failed");
    await expect(flights.do("key", () => 2)).resolves.toBe(2);
  });

  it("can forget or clear in-flight keys without cancelling work", async () => {
    const flights = new Singleflight<string>();
    const first = flights.do("a", () => 1);
    flights.do("b", () => 2);
    expect(flights.forget("missing")).toBe(false);
    expect(flights.forget("a")).toBe(true);
    flights.clear();
    await expect(first).resolves.toBe(1);
    expect(flights.size).toBe(0);
  });
});
