import styles from './Toast.module.css';

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div role="alert" class={`${styles.toast} ${visible ? styles.visible : ''}`}>
      {message}
    </div>
  );
}
