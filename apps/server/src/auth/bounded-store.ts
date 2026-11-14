export interface StoreOptions {
  now?: () => number;
  capacity?: number;
}

interface Entry<T> {
  value: T;
  expires: number;
}

export class BoundedStore<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly now: () => number;
  private readonly capacity: number;

  constructor(options: StoreOptions) {
    this.now = options.now ?? Date.now;
    this.capacity = options.capacity ?? 1024;
    if (!Number.isSafeInteger(this.capacity) || this.capacity < 1) {
      throw new Error('Invalid store capacity');
    }
  }

  add(key: string, value: T, lifetime: number): void {
    const now = this.now();
    for (const [entryKey, entry] of this.entries) {
      if (entry.expires <= now) {
        this.entries.delete(entryKey);
      }
    }
    while (this.entries.size >= this.capacity) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) {
        this.entries.delete(oldest);
      }
    }
    this.entries.set(key, { value, expires: now + lifetime });
  }

  get(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expires <= this.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  delete(key: string): void {
    this.entries.delete(key);
  }
}
