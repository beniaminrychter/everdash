import type { AuthDiscoverResponse, DiscoveredHomeAssistant } from '@everdash/contracts/auth/oauth';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { adminHomeUrl, apiUrl } from '@/lib/api';

/** Starts the Home Assistant sign-in again. Returns false when the server refused. */
export async function reconnectHomeAssistant(): Promise<boolean> {
  const response = await fetch(apiUrl('api/manage/auth/start'), {
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
  const response = await fetch(apiUrl('api/manage/auth/disconnect'), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'X-EverDash-Request': '1' },
  }).catch(() => null);

  if (!response?.ok) {
    return false;
  }

  window.location.assign(adminHomeUrl());

  return true;
}

/** Scans the local network for reachable Home Assistant instances. */
export async function discoverHomeAssistantInstances(
  signal?: AbortSignal,
): Promise<DiscoveredHomeAssistant[]> {
  const response = await fetch(apiUrl('api/manage/auth/discover'), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
    body: JSON.stringify({}),
    signal,
  });

  if (!response.ok) {
    throw new Error(m.admin_ha_scan_error());
  }

  const result = (await response.json()) as AuthDiscoverResponse;

  return Array.isArray(result.instances) ? result.instances : [];
}

/** Disconnects the current Home Assistant and starts OAuth sign-in against `origin`. */
export async function switchHomeAssistant(origin: string): Promise<boolean> {
  const disconnected = await fetch(apiUrl('api/manage/auth/disconnect'), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'X-EverDash-Request': '1' },
  }).catch(() => null);

  if (!disconnected?.ok) {
    return false;
  }

  const started = await fetch(apiUrl('api/manage/auth/start'), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
    body: JSON.stringify({ intent: 'login', homeAssistantOrigin: origin }),
  }).catch(() => null);

  if (!started) {
    window.location.assign(`${adminHomeUrl()}?auth_error=HA_UNREACHABLE`);

    return true;
  }

  const result = (await started.json().catch(() => ({}))) as {
    authorizationUrl?: string;
    error?: string;
  };

  if (!started.ok || !result.authorizationUrl) {
    const code = result.error ?? 'HA_UNREACHABLE';

    window.location.assign(`${adminHomeUrl()}?auth_error=${encodeURIComponent(code)}`);

    return true;
  }

  window.location.assign(result.authorizationUrl);

  return true;
}
