import { useEffect, useRef, useState } from 'preact/hooks';
import { useI18n } from '@everdash/ui/i18n/index';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import styles from './SceneCard.module.css';

type RunState = 'idle' | 'running' | 'done' | 'failed';

interface Props {
  name: string;
  icon: IconName;
  entityId: string;
  /** Why the scene cannot be run, such as an unavailable entity. */
  problem?: boolean;
  disabled?: boolean;
  onRun: (entityId: string) => Promise<void>;
}

const feedbackMs = 2000;

const stateClass: Record<RunState, string> = {
  done: styles.done,
  failed: styles.failed,
  idle: '',
  running: styles.running,
};

export function SceneCard({
  name,
  icon,
  entityId,
  problem = false,
  disabled = false,
  onRun,
}: Props) {
  const { t } = useI18n();
  const [state, setState] = useState<RunState>('idle');
  const running = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
      clearTimeout(timer.current);
    },
    [],
  );

  const finish = (next: RunState) => {
    running.current = false;
    if (!mounted.current) {
      return;
    }

    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (mounted.current) {
        setState('idle');
      }
    }, feedbackMs);
  };

  const run = () => {
    // Ignore taps while a call is in flight.
    if (running.current || disabled || problem) {
      return;
    }

    running.current = true;
    clearTimeout(timer.current);
    setState('running');
    onRun(entityId)
      .then(() => finish('done'))
      .catch(() => finish('failed'));
  };

  const status = problem
    ? t('Unavailable')
    : {
        done: t('Done'),
        failed: t('Failed'),
        idle: t('Tap to run'),
        running: t('Running…'),
      }[state];

  return (
    <button
      type="button"
      class={`${styles.card} ${problem ? styles.isUnavailable : ''} ${stateClass[state]}`}
      aria-label={`${name}: ${status}`}
      aria-busy={state === 'running'}
      disabled={disabled || problem}
      onClick={run}
      data-scene-card={state}
      data-scene-entity={entityId}
    >
      <span class={styles.disc}>
        <Icon name={state === 'done' ? 'check' : icon} className={styles.icon} />
      </span>
      <span class={styles.text}>
        <span class={styles.name}>{name}</span>
        <output class={styles.status} data-testid="scene-status">
          {status}
        </output>
      </span>
    </button>
  );
}
