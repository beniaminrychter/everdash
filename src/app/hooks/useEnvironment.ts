import { useEffect, useState } from 'preact/hooks';

const formatDate = () =>
  new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });

export function useEnvironment() {
  const [date, setDate] = useState(formatDate);
  const [now, setNow] = useState(Date.now);
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const interval = window.setInterval(() => {
      setDate(formatDate());
      setNow(Date.now());
    }, 60_000);
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);
  return { date, now, online };
}
