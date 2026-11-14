import { ConnectorRepository } from './connector-repository';
import { revokeGrant } from './oauth-protocol';

/**
 * Recovery for an administrator who cannot sign in, e.g. after the Home
 * Assistant address changed. Requires shell access to the server's data
 * directory, which is the same trust level as editing `/data` directly.
 */
export async function resetConnection(
  directory: string,
  revoke: typeof revokeGrant = revokeGrant,
): Promise<{ removed: string | null; revoked: boolean }> {
  const repository = new ConnectorRepository({ directory });
  const removed = await repository.remove();
  if (!removed) {
    return { removed: null, revoked: false };
  }

  try {
    await revoke(removed.origin, removed.refreshToken, { timeoutMs: 5_000 });
    return { removed: removed.origin, revoked: true };
  } catch {
    return { removed: removed.origin, revoked: false };
  }
}
