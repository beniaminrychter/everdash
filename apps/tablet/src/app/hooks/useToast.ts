import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

export function useToast() {
  const [toast, setToast] = useState({ message: '', visible: false });
  const timer = useRef<number>();
  const notify = useCallback((message: string) => {
    window.clearTimeout(timer.current);
    setToast({ message, visible: true });
    timer.current = window.setTimeout(
      () => setToast((current) => ({ ...current, visible: false })),
      5000,
    );
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { notify, toast };
}
