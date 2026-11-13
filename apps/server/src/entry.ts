import { pathToFileURL } from 'node:url';

async function startFromCommandLine() {
  try {
    const { createStandaloneApp } = await import('./standalone');
    const { app } = await createStandaloneApp();
    await app.listen({
      host: process.env.EVERDASH_HOST ?? '0.0.0.0',
      port: Number(process.env.EVERDASH_PORT ?? 8095),
    });
    const stop = () => {
      app.close().finally(() => process.exit(0));
    };
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
  } catch (error) {
    process.stderr.write(
      `EverDash failed to start: ${error instanceof Error ? error.message : 'unknown error'}\n`,
    );
    process.exitCode = 1;
  }
}

async function resetFromCommandLine() {
  let result: { removed: string | null; revoked: boolean };
  try {
    const { resetConnection } = await import('./auth/reset-connection');
    result = await resetConnection(process.env.EVERDASH_DATA_DIR ?? '/data');
  } catch (error) {
    process.stderr.write(
      `Reset failed: ${error instanceof Error ? error.message : 'unknown error'}\n`,
    );
    process.exitCode = 1;
    return;
  }

  if (!result.removed) {
    process.stdout.write('No Home Assistant connection was configured.\n');
    return;
  }

  process.stdout.write(
    `Forgot the Home Assistant connection to ${result.removed}.${
      result.revoked
        ? ''
        : ' Its token could not be revoked; remove it in Home Assistant if needed.'
    }\nOpen /admin/ to connect again.\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--reset-connection')) {
    resetFromCommandLine();
  } else {
    startFromCommandLine();
  }
}
