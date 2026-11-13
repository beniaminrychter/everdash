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
