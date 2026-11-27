import type { HomeAssistantTransport } from './client';

const LANGUAGE_TIMEOUT_MS = 2000;

/**
 * Extracts the configured language from a Home Assistant `/api/config` payload.
 * Returns `undefined` when the payload does not include a non-empty language string.
 */
export function extractHomeAssistantLanguage(config: unknown): string | undefined {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return undefined;
  }

  const language = (config as Record<string, unknown>).language;

  if (typeof language !== 'string') {
    return undefined;
  }

  const trimmed = language.trim();

  return trimmed || undefined;
}

/**
 * Reads the configured Home Assistant language best-effort.
 * Never throws; returns `undefined` if Home Assistant is unreachable or omits `language`.
 */
export async function readHomeAssistantLanguage(
  homeAssistant: HomeAssistantTransport | undefined,
  signal?: AbortSignal,
): Promise<string | undefined> {
  if (!homeAssistant?.getConfig) {
    return undefined;
  }

  const timeout = AbortSignal.timeout(LANGUAGE_TIMEOUT_MS);
  const requestSignal = signal ? AbortSignal.any([timeout, signal]) : timeout;

  try {
    const config = await homeAssistant.getConfig(requestSignal);

    return extractHomeAssistantLanguage(config);
  } catch {
    return undefined;
  }
}
