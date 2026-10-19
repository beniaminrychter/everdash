import {
  closeSync,
  chmodSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import type { DashboardDocument } from '../../src/shared/config/types';
import { validateDashboard } from '../../src/shared/config/validate';
import type { DashboardValidation } from '../../src/shared/config/validate';
import { ConfigRepositoryError } from './errors';
import { dashboardRevision } from './revision';

export interface ConfigSnapshot {
  revision: string;
  config: DashboardDocument;
}

export interface ConfigDiagnostic {
  code: 'RECOVERED_PREVIOUS' | 'CONFIG_RECOVERY_REQUIRED';
  message: string;
}

export type ConfigFaultPoint = 'beforePreviousRename' | 'beforeCurrentTemp' | 'beforeCurrentRename';

export interface ConfigRepositoryOptions {
  directory: string;
  fault?: (point: ConfigFaultPoint) => void;
}

const DEFAULT_DOCUMENT: DashboardDocument = {
  schemaVersion: 1,
  views: [{ id: 'home', title: 'Home', cards: [] }],
};

export class ConfigRepository extends EventTarget {
  private readonly currentPath: string;
  private readonly previousPath: string;
  private current: ConfigSnapshot | null = null;
  private currentIsPersisted = false;
  private readonly validator = validateDashboard;
  private queue: Promise<void> = Promise.resolve();
  diagnostic: ConfigDiagnostic | null = null;

  constructor(private readonly options: ConfigRepositoryOptions) {
    super();
    this.currentPath = join(options.directory, 'dashboard.json');
    this.previousPath = join(options.directory, 'dashboard.previous.json');
  }

  validate(input: unknown): DashboardValidation {
    return this.validator(input);
  }

  revision(document: DashboardDocument): string {
    const validation = this.validator(document);
    if (!validation.ok) {
      throw new ConfigRepositoryError(
        'Cannot calculate a revision for an invalid dashboard.',
        'CONFIG_INVALID',
        validation.issues,
      );
    }
    return dashboardRevision(validation.document);
  }

  read(): ConfigSnapshot | null {
    if (this.current) {
      return this.current;
    }
    this.ensureDirectory();

    const current = ConfigRepository.readDocument(this.currentPath);
    if (current) {
      this.current = ConfigRepository.snapshot(current);
      this.currentIsPersisted = true;
      return this.current;
    }

    const previous = ConfigRepository.readDocument(this.previousPath);
    if (previous) {
      this.current = ConfigRepository.snapshot(previous);
      this.currentIsPersisted = false;
      this.diagnostic = {
        code: 'RECOVERED_PREVIOUS',
        message:
          'The current dashboard was invalid. The previous valid dashboard has been restored.',
      };
      this.writeRecovery(previous);
      return this.current;
    }

    if (!existsSync(this.currentPath) && !existsSync(this.previousPath)) {
      this.current = ConfigRepository.snapshot(DEFAULT_DOCUMENT);
      return this.current;
    }

    this.diagnostic = {
      code: 'CONFIG_RECOVERY_REQUIRED',
      message:
        'Neither saved dashboard copy is valid. Restore a valid dashboard JSON file to continue.',
    };
    return null;
  }

  readPrevious(): DashboardDocument | null {
    this.ensureDirectory();
    return ConfigRepository.readDocument(this.previousPath);
  }

  save(baseRevision: string | null, input: unknown): Promise<ConfigSnapshot> {
    const operation = this.queue.then(() => this.saveSerialized(baseRevision, input));
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  private async saveSerialized(
    baseRevision: string | null,
    input: unknown,
  ): Promise<ConfigSnapshot> {
    const current = this.read();
    if (!current) {
      throw new ConfigRepositoryError(
        'Configuration recovery is required before saving.',
        'CONFIG_RECOVERY_REQUIRED',
      );
    }
    if (baseRevision !== current.revision) {
      throw new ConfigRepositoryError(
        'The dashboard changed since it was loaded.',
        'CONFIG_CONFLICT',
      );
    }

    const validation = validateDashboard(input);
    if (!validation.ok) {
      throw new ConfigRepositoryError(
        'Dashboard validation failed.',
        'CONFIG_INVALID',
        validation.issues,
      );
    }

    const next = ConfigRepository.snapshot(validation.document);
    this.ensureDirectory();
    if (this.currentIsPersisted) {
      this.writeAtomic(this.previousPath, current.config, 'beforePreviousRename');
    }
    this.options.fault?.('beforeCurrentTemp');
    this.writeAtomic(this.currentPath, next.config, 'beforeCurrentRename');
    this.current = next;
    this.currentIsPersisted = true;
    this.diagnostic = null;
    const event = new Event('change') as Event & { snapshot: ConfigSnapshot };
    event.snapshot = next;
    this.dispatchEvent(event);
    return next;
  }

  private static snapshot(document: DashboardDocument): ConfigSnapshot {
    return { revision: dashboardRevision(document), config: document };
  }

  private static readDocument(path: string): DashboardDocument | null {
    if (!existsSync(path)) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
      const validation = validateDashboard(parsed);
      return validation.ok ? validation.document : null;
    } catch {
      return null;
    }
  }

  private ensureDirectory() {
    mkdirSync(this.options.directory, { recursive: true, mode: 0o700 });
    if ((statSync(this.options.directory).mode & 0o077) !== 0) {
      // Tighten a pre-existing directory that may have been created with broad permissions.
      chmodSync(this.options.directory, 0o700);
    }
  }

  private writeRecovery(document: DashboardDocument) {
    try {
      this.writeAtomic(this.currentPath, document);
      this.currentIsPersisted = true;
    } catch {
      // Keep the valid in-memory snapshot and diagnostic; management can still download/re-save it.
    }
  }

  private writeAtomic(path: string, document: DashboardDocument, faultPoint?: ConfigFaultPoint) {
    const temporary = `${path}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
    let fileDescriptor: number | undefined;
    try {
      const serialized = `${JSON.stringify(document, null, 2)}\n`;
      fileDescriptor = openSync(temporary, 'wx', 0o600);
      writeFileSync(fileDescriptor, serialized, 'utf8');
      fsyncSync(fileDescriptor);
      closeSync(fileDescriptor);
      fileDescriptor = undefined;
      if (faultPoint) {
        this.options.fault?.(faultPoint);
      }
      renameSync(temporary, path);
      const directoryDescriptor = openSync(dirname(path), 'r');
      try {
        fsyncSync(directoryDescriptor);
      } finally {
        closeSync(directoryDescriptor);
      }
    } catch (error) {
      if (fileDescriptor !== undefined) {
        closeSync(fileDescriptor);
      }
      rmSync(temporary, { force: true });
      throw error;
    }
  }
}
