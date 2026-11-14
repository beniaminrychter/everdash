import {
  chmodSync,
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

export function ensurePrivateDirectory(directory: string): void {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if ((statSync(directory).mode & 0o077) !== 0) {
    chmodSync(directory, 0o700);
  }
}

export class AtomicJsonDurabilityError extends Error {
  constructor() {
    super('The file was replaced, but directory durability could not be confirmed.');
    this.name = 'AtomicJsonDurabilityError';
  }
}

export function writeAtomicJson(
  path: string,
  value: unknown,
  beforeRename?: () => void,
  beforeDirectorySync?: () => void,
): void {
  const temporary = `${path}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
  let descriptor: number | undefined;
  let renamed = false;
  try {
    descriptor = openSync(temporary, 'wx', 0o600);
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    beforeRename?.();
    renameSync(temporary, path);
    renamed = true;
    beforeDirectorySync?.();
    const directoryDescriptor = openSync(dirname(path), 'r');
    try {
      fsyncSync(directoryDescriptor);
    } finally {
      closeSync(directoryDescriptor);
    }
  } catch (error) {
    if (descriptor !== undefined) {
      closeSync(descriptor);
    }
    if (renamed) {
      throw new AtomicJsonDurabilityError();
    }
    rmSync(temporary, { force: true });
    throw error;
  }
}
