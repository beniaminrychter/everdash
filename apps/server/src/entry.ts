import { pathToFileURL } from 'node:url';

async function startFromCommandLine() {
  try {
    const { startEverDash } = await import('./http/listeners');
    await startEverDash();
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
