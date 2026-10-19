export const TRUSTED_SUPERVISOR_PEER = '172.30.32.2';

export interface IngressRequestLike {
  headers: Record<string, string | string[] | undefined>;
  socket: { remoteAddress?: string };
}

function normalizeIPv4MappedAddress(address: string): string {
  const value = address.toLowerCase();
  if (value.startsWith('::ffff:')) {
    const mapped = value.slice('::ffff:'.length);
    if (/^[0-9a-f]{1,4}:[0-9a-f]{1,4}$/.test(mapped)) {
      const [high = '0', low = '0'] = mapped.split(':');
      const combined = (Number.parseInt(high, 16) << 16) | Number.parseInt(low, 16);
      return [24, 16, 8, 0].map((shift) => (combined >>> shift) & 255).join('.');
    }
    return mapped;
  }
  return value;
}

export function isTrustedIngressPeer(remoteAddress: string | undefined): boolean {
  return (
    typeof remoteAddress === 'string' &&
    normalizeIPv4MappedAddress(remoteAddress) === TRUSTED_SUPERVISOR_PEER
  );
}

export function getIngressUserId(request: IngressRequestLike): string | null {
  if (!isTrustedIngressPeer(request.socket.remoteAddress)) {
    return null;
  }
  const raw = request.headers['x-remote-user-id'];
  if (typeof raw !== 'string') {
    return null;
  }
  const userId = raw.trim();
  return userId.length > 0 && userId.length <= 256 ? userId : null;
}
