import { resolve } from 'node:path';
import type { Alias } from 'vite';

const packagesDirectory = resolve(import.meta.dirname, '..', 'packages');

/**
 * Resolves `@everdash/<package>/<path>` to that package's `src` directory and,
 * when an app source directory is given, `@/<path>` to that app's `src`.
 * Keep in sync with the `paths` in each tsconfig.
 */
export function workspaceAliases(appSrc?: string): Alias[] {
  const aliases: Alias[] = [
    {
      find: /^@everdash\/(contracts|ui|dashboard)\//,
      replacement: `${packagesDirectory}/$1/src/`,
    },
  ];

  if (appSrc) {
    aliases.push({ find: /^@\//, replacement: `${appSrc}/` });
  }

  return aliases;
}
