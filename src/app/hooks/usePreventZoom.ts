import { useEffect } from 'preact/hooks';

export function usePreventZoom(): void {
  useEffect(() => {
    // iOS Safari can ignore the viewport zoom limit, so cancel its gesture events too.
    const preventGesture = (event: Event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
    };
    const preventPinch = (event: TouchEvent) => {
      if (event.touches.length > 1 && event.cancelable) {
        event.preventDefault();
      }
    };
    const options = { passive: false };
    document.addEventListener('gesturestart', preventGesture, options);
    document.addEventListener('gesturechange', preventGesture, options);
    document.addEventListener('touchstart', preventPinch, options);
    document.addEventListener('touchmove', preventPinch, options);
    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('touchstart', preventPinch);
      document.removeEventListener('touchmove', preventPinch);
    };
  }, []);
}
