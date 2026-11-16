import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');

function sources(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);

    if (statSync(path).isDirectory()) {
      return sources(path);
    }

    return /\.(?:ts|tsx)$/.test(name) ? [path] : [];
  });
}

function imports(file: string): string[] {
  const code = readFileSync(file, 'utf8');

  return [...code.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((match) => match[1]!);
}

test('the tablet and shared dashboard code never import the editor chrome or SortableJS', () => {
  const editorDirectory = join(root, 'packages', 'dashboard', 'src', 'editor');
  const files = [
    ...sources(join(root, 'apps', 'tablet', 'src')),
    ...sources(join(root, 'packages', 'dashboard', 'src')).filter(
      (file) => !file.startsWith(`${editorDirectory}${sep}`),
    ),
    ...sources(join(root, 'packages', 'ui', 'src')),
    ...sources(join(root, 'packages', 'contracts', 'src')),
  ];

  assert.ok(files.length > 50);

  const offenders = files.flatMap((file) =>
    imports(file)
      .filter((specifier) => /sortablejs|(?:^|\/)editor(?:\/|$)/.test(specifier))
      .map((specifier) => `${relative(root, file)} imports ${specifier}`),
  );

  assert.deepEqual(offenders, []);
});

test('the editor chrome is reached only through mountDashboardCanvas', () => {
  const users = sources(join(root, 'apps')).flatMap((file) =>
    imports(file)
      .filter((specifier) => specifier.includes('dashboard/editor/'))
      .map((specifier) => `${relative(root, file)} -> ${specifier}`),
  );

  assert.ok(users.length > 0);
  assert.ok(
    users.every((use) => use.endsWith('dashboard/editor/mountDashboardCanvas')),
    users.join('\n'),
  );
});
