import { existsSync } from 'node:fs';
import { readLocalRuntimeConfig } from '../server/http/local.ts';

const environmentFile = '.env.local';
if (!existsSync(environmentFile)) {
  process.stderr.write(
    'Missing .env.local. Copy local.env.example to .env.local and add a Home Assistant token.\n',
  );
  process.exitCode = 1;
} else {
  try {
    process.loadEnvFile(environmentFile);
    readLocalRuntimeConfig(process.env);
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Local environment is invalid.'}\n`,
    );
    process.exitCode = 1;
  }
}
