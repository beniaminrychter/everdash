import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { chmod, mkdir, open, readFile, rename, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface DeviceInfo {
  id: string;
  label: string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}

interface StoredDevice extends DeviceInfo {
  sessionDigest: string;
}

export interface DeviceRepositoryOptions {
  directory: string;
  now?: () => number;
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function safeDigestEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parseDevices(source: string): StoredDevice[] {
  const value: unknown = JSON.parse(source);
  if (!Array.isArray(value)) {
    throw new Error('Persisted device data must be an array.');
  }
  return value.map((record) => {
    if (
      typeof record !== 'object' ||
      record === null ||
      typeof record.id !== 'string' ||
      typeof record.label !== 'string' ||
      typeof record.createdAt !== 'number' ||
      typeof record.expiresAt !== 'number' ||
      (record.revokedAt !== null && typeof record.revokedAt !== 'number') ||
      typeof record.sessionDigest !== 'string' ||
      !/^[a-f0-9]{64}$/.test(record.sessionDigest) ||
      Object.keys(record).some(
        (key) =>
          !['id', 'label', 'createdAt', 'expiresAt', 'revokedAt', 'sessionDigest'].includes(key),
      )
    ) {
      throw new Error('Persisted device record is invalid.');
    }
    return record as StoredDevice;
  });
}

export class DeviceRepository {
  private readonly filePath: string;
  private readonly now: () => number;
  private records: StoredDevice[] | null = null;
  private queue: Promise<void> = Promise.resolve();

  constructor(options: DeviceRepositoryOptions) {
    this.filePath = join(options.directory, 'devices.json');
    this.now = options.now ?? Date.now;
  }

  async list(): Promise<DeviceInfo[]> {
    const records = await this.load();
    return records.map(({ sessionDigest: _sessionDigest, ...device }) => ({ ...device }));
  }

  async add(label: string, session: string): Promise<DeviceInfo> {
    return this.serialize(async () => {
      const records = (await this.load()).map((record) => ({ ...record }));
      const now = this.now();
      const stored: StoredDevice = {
        id: randomBytes(16).toString('hex'),
        label,
        createdAt: now,
        expiresAt: now + 365 * 24 * 60 * 60 * 1000,
        revokedAt: null,
        sessionDigest: digest(session),
      };
      records.push(stored);
      await this.persist(records);
      this.records = records;
      const { sessionDigest: _sessionDigest, ...device } = stored;
      return device;
    });
  }

  async authorize(session: string): Promise<boolean> {
    if (!session || session.length > 256) {
      return false;
    }
    const candidate = digest(session);
    const now = this.now();
    return (await this.load()).some(
      (device) =>
        device.revokedAt === null &&
        device.expiresAt > now &&
        safeDigestEquals(device.sessionDigest, candidate),
    );
  }

  async revoke(deviceId: string): Promise<boolean> {
    return this.serialize(async () => {
      const records = (await this.load()).map((record) => ({ ...record }));
      const device = records.find((record) => record.id === deviceId);
      if (!device || device.revokedAt !== null) {
        return false;
      }
      device.revokedAt = this.now();
      await this.persist(records);
      this.records = records;
      return true;
    });
  }

  async revokeSession(session: string): Promise<boolean> {
    if (!session || session.length > 256) {
      return false;
    }
    const candidate = digest(session);
    const records = await this.load();
    const device = records.find(
      (record) => record.revokedAt === null && safeDigestEquals(record.sessionDigest, candidate),
    );
    return device ? this.revoke(device.id) : false;
  }

  private async serialize<T>(operation: () => Promise<T>): Promise<T> {
    const current = this.queue.then(operation);
    this.queue = current.then(
      () => undefined,
      () => undefined,
    );
    return current;
  }

  private async load(): Promise<StoredDevice[]> {
    if (this.records) {
      return this.records;
    }
    await this.ensureDirectory();
    try {
      const fileStat = await stat(this.filePath);
      if ((fileStat.mode & 0o077) !== 0) {
        await chmod(this.filePath, 0o600);
      }
      this.records = parseDevices(await readFile(this.filePath, 'utf8'));
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        this.records = [];
      } else {
        throw error;
      }
    }
    return this.records;
  }

  private async ensureDirectory() {
    await mkdir(dirname(this.filePath), { recursive: true, mode: 0o700 });
    const directoryStat = await stat(dirname(this.filePath));
    if ((directoryStat.mode & 0o077) !== 0) {
      await chmod(dirname(this.filePath), 0o700);
    }
  }

  private async persist(records: StoredDevice[]) {
    await this.ensureDirectory();
    const temporary = `${this.filePath}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
    let handle: Awaited<ReturnType<typeof open>> | null = null;
    try {
      handle = await open(temporary, 'wx', 0o600);
      await handle.writeFile(`${JSON.stringify(records, null, 2)}\n`, 'utf8');
      await handle.sync();
      await handle.close();
      handle = null;
      await rename(temporary, this.filePath);
      const directoryHandle = await open(dirname(this.filePath), 'r');
      try {
        await directoryHandle.sync();
      } finally {
        await directoryHandle.close();
      }
    } catch (error) {
      await handle?.close();
      await rm(temporary, { force: true });
      throw error;
    }
  }
}
