export function parseHomeAssistantOrigin(input: string): string {
  // Inspect the original syntax as URL normalization can erase paths and empty delimiters.
  if (!/^https?:\/\/[^/?#@\\\s]+\/?$/i.test(input)) {
    throw new Error('Invalid Home Assistant origin.');
  }
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Invalid Home Assistant origin.');
  }
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    !url.hostname
  ) {
    throw new Error('Invalid Home Assistant origin.');
  }
  return url.origin;
}
