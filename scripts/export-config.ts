import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateDashboard } from '../src/shared/config/validate';

const sourcePath = resolve(process.argv[2] || '.local/home.config.ts');
const outputPath = resolve(process.argv[3] || '.local/dashboard.json');
const imported = await import(pathToFileURL(sourcePath).href);
const input = { schemaVersion: 1, ...imported.default };
const defaults: Record<string, string> = {
  climate: 'thermometer',
  light: 'bulb',
  outlet: 'outlet',
  pstryk: 'plug',
  temperature: 'thermometer',
  weather: 'sun',
};

for (const view of input.views) {
  for (const badge of view.badges || []) {
    if (badge.icon === defaults.temperature) {
      delete badge.icon;
    }
  }
  for (const card of view.cards || []) {
    if (card.icon === defaults[card.type]) {
      delete card.icon;
    }
    if (!['light', 'outlet'].includes(card.type)) {
      delete card.icon;
    }
  }
}

const result = validateDashboard(input);

if (!result.ok) {
  process.stderr.write(
    'Cannot export dashboard configuration: ' +
      result.issues.map(({ path, message }) => path + ': ' + message).join('; ') +
      '\n',
  );
  process.exitCode = 1;
} else {
  mkdirSync(dirname(outputPath), { recursive: true, mode: 0o700 });
  writeFileSync(outputPath, JSON.stringify(result.document, null, 2) + '\n', {
    mode: 0o600,
  });
  process.stdout.write('Exported dashboard configuration to ' + outputPath + '\n');
}
