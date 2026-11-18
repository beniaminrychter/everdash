import type { AuthDiscoverResponse, DiscoveredHomeAssistant } from '@everdash/contracts/auth/oauth';

/** Starts the Home Assistant sign-in again. Returns false when the server refused. */
export async function reconnectHomeAssistant(): Promise<boolean> {
  const response = await fetch('/api/manage/auth/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
    body: JSON.stringify({ intent: 'reconnect' }),
  }).catch(() => null);

  if (!response?.ok) {
    return false;
  }

  const result = (await response.json()) as { authorizationUrl: string };

  window.location.assign(result.authorizationUrl);

  return true;
}

/** Forgets the Home Assistant connection. Returns false when the server refused. */
export async function disconnectHomeAssistant(): Promise<boolean> {
  const response = await fetch('/api/manage/auth/disconnect', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'X-EverDash-Request': '1' },
  }).catch(() => null);

  if (!response?.ok) {
    return false;
  }

  window.location.assign('/admin/');

  return true;
}

/** Scans the local network for reachable Home Assistant instances. */
export async function discoverHomeAssistantInstances(
  signal?: AbortSignal,
): Promise<DiscoveredHomeAssistant[]> {
  const response = await fetch('/api/manage/auth/discover', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
    body: JSON.stringify({}),
    signal,
  });

  if (!response.ok) {
    throw new Error('Could not scan the local network for Home Assistant.');
  }

  const result = (await response.json()) as AuthDiscoverResponse;

  return Array.isArray(result.instances) ? result.instances : [];
}

/** Disconnects the current Home Assistant and starts OAuth sign-in against `origin`. */
export async function switchHomeAssistant(origin: string): Promise<boolean> {
  const disconnected = await fetch('/api/manage/auth/disconnect', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'X-EverDash-Request': '1' },
  }).catch(() => null);

  if (!disconnected?.ok) {
    return false;
  }

  const started = await fetch('/api/manage/auth/start', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
    body: JSON.stringify({ intent: 'login', homeAssistantOrigin: origin }),
  }).catch(() => null);

  if (!started) {
    window.location.assign('/admin/?auth_error=HA_UNREACHABLE');

    return true;
  }

  const result = (await started.json().catch(() => ({}))) as {
    authorizationUrl?: string;
    error?: string;
  };

  if (!started.ok || !result.authorizationUrl) {
    const code = result.error ?? 'HA_UNREACHABLE';

    window.location.assign(`/admin/?auth_error=${encodeURIComponent(code)}`);

    return true;
  }

  window.location.assign(result.authorizationUrl);

  return true;
}
