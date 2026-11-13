import { pathToFileURL } from 'node:url';

async function startFromCommandLine() {
  try {
    const { createStandaloneApp } = await import('./standalone');
    const { app } = await createStandaloneApp();
    await app.listen({ host: '0.0.0.0', port: 8095 });
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startFromCommandLine();
}
