import styles from './EditorIcon.module.css';

export type EditorIconName = 'pencil' | 'more' | 'grip' | 'check';

const paths: Record<EditorIconName, string[]> = {
  pencil: [
    'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
    'm15 5 4 4',
  ],
  more: ['M12 5h.01', 'M12 12h.01', 'M12 19h.01'],
  grip: ['M9 6h.01', 'M9 12h.01', 'M9 18h.01', 'M15 6h.01', 'M15 12h.01', 'M15 18h.01'],
  check: ['M20 6 9 17l-5-5'],
};

/** A small stroked icon for the editor's own buttons. */
export function EditorIcon({ name }: { name: EditorIconName }) {
  const dots = name === 'more' || name === 'grip';

  return (
    <svg
      class={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={dots ? '3.2' : '2'}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {paths[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
