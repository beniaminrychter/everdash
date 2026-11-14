import { useEffect, useState } from 'preact/hooks';
import styles from './Toast.module.css';

type ToastType = 'success' | 'info' | 'error';
interface ToastInput {
  title: string;
  description?: string;
  type?: ToastType;
}
type ToastRecord = ToastInput & { id: number };
type Listener = (items: ToastRecord[]) => void;

const maxToasts = 5;
const duration = 5000;
let nextId = 0;
let toasts: ToastRecord[] = [];
const listeners: Listener[] = [];
const timers: Record<number, ReturnType<typeof setTimeout>> = {};

function notify() {
  listeners.slice().forEach((listener) => listener(toasts));
}

function close(id: number) {
  clearTimeout(timers[id]);
  delete timers[id];
  const remaining = toasts.filter((item) => item.id !== id);
  if (remaining.length !== toasts.length) {
    toasts = remaining;
    notify();
  }
}

export const toastManager = {
  add(input: ToastInput) {
    if (toasts.length >= maxToasts) {
      close(toasts[0].id);
    }

    const id = ++nextId;
    toasts = [...toasts, { ...input, id }];
    timers[id] = setTimeout(() => close(id), duration);
    notify();
    return id;
  },
  close,
};

export function Toaster() {
  const [items, setItems] = useState<ToastRecord[]>(toasts);

  useEffect(() => {
    listeners.push(setItems);
    setItems(toasts);
    return () => {
      const index = listeners.indexOf(setItems);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return (
    <div aria-label="Notifications" className={styles.viewport}>
      {items.map((item) => (
        <div
          className={styles.toast}
          key={item.id}
          role={item.type === 'error' ? 'alert' : 'status'}
        >
          <div className={styles.copy}>
            <span className={styles.kind}>
              {item.type === 'error' ? 'Error' : item.type === 'success' ? 'Success' : 'Info'}
            </span>
            <strong>{item.title}</strong>
            {item.description && <div>{item.description}</div>}
          </div>
          <button
            aria-label="Dismiss notification"
            className={styles.close}
            onClick={() => close(item.id)}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
