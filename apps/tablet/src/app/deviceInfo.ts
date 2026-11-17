/** Collects browser-safe device type and screen size for device registration (Safari 12+). */
export function detectDeviceType(): string {
  const ua = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' && navigator.platform ? navigator.platform : '';

  if (/iPad/i.test(ua)) {
    return 'iPad';
  }

  if (/iPhone/i.test(ua)) {
    return 'iPhone';
  }

  if (/iPod/i.test(ua)) {
    return 'iPod';
  }

  if (/Android/i.test(ua)) {
    return /Mobile/i.test(ua) ? 'Android phone' : 'Android tablet';
  }

  // iPadOS/iOS 13+ reports Macintosh in User-Agent when requesting desktop site.
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1 &&
    (/Macintosh/i.test(ua) || platform === 'MacIntel')
  ) {
    if (
      /iPhone/i.test(platform) ||
      (typeof window !== 'undefined' &&
        window.screen &&
        typeof window.screen.width === 'number' &&
        typeof window.screen.height === 'number' &&
        Math.min(window.screen.width, window.screen.height) > 0 &&
        Math.min(window.screen.width, window.screen.height) < 600)
    ) {
      return 'iPhone';
    }

    return 'iPad';
  }

  if (/Macintosh|Mac OS X/i.test(ua)) {
    return 'Mac';
  }

  if (/Windows/i.test(ua)) {
    return 'Windows PC';
  }

  if (/CrOS/i.test(ua)) {
    return 'Chromebook';
  }

  if (/Linux/i.test(ua)) {
    return 'Linux';
  }

  return 'Browser';
}

export function detectScreenSize(): string {
  const screenWidth =
    typeof window !== 'undefined' && window.screen && typeof window.screen.width === 'number'
      ? Math.round(window.screen.width)
      : 0;
  const screenHeight =
    typeof window !== 'undefined' && window.screen && typeof window.screen.height === 'number'
      ? Math.round(window.screen.height)
      : 0;
  const width =
    screenWidth > 0
      ? screenWidth
      : typeof window !== 'undefined'
        ? Math.round(window.innerWidth || 0)
        : 0;
  const height =
    screenHeight > 0
      ? screenHeight
      : typeof window !== 'undefined'
        ? Math.round(window.innerHeight || 0)
        : 0;

  if (width <= 0 || height <= 0) {
    return 'Unknown';
  }

  return `${width} × ${height}`;
}
