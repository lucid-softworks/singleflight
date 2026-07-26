/** Coalesces concurrent operations by key without caching settled results. */
export class Singleflight<TKey> {
  private readonly flights = new Map<TKey, Promise<unknown>>();

  get size(): number {
    return this.flights.size;
  }

  has(key: TKey): boolean {
    return this.flights.has(key);
  }

  do<TValue>(
    key: TKey,
    task: () => TValue | PromiseLike<TValue>,
  ): Promise<TValue> {
    const existing = this.flights.get(key);
    if (existing) return existing as Promise<TValue>;

    const flight = Promise.resolve().then(task);
    this.flights.set(key, flight);
    void flight.then(
      () => this.deleteIfCurrent(key, flight),
      () => this.deleteIfCurrent(key, flight),
    );
    return flight;
  }

  forget(key: TKey): boolean {
    return this.flights.delete(key);
  }

  clear(): void {
    this.flights.clear();
  }

  private deleteIfCurrent(key: TKey, flight: Promise<unknown>): void {
    if (this.flights.get(key) === flight) this.flights.delete(key);
  }
}
