import { useEffect, useRef } from 'preact/hooks';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import type { IconName } from '@everdash/ui/ui/Icon/Icon';
import { glyphOn } from '../../../../shared/color/tint';
import styles from './BrightnessSlider.module.css';

/** Below this brightness the fill no longer reaches the glyph, which then sits on the empty track. */
const glyphOnFillFrom = 18;
/** How far from the bottom edge, in pixels, a press still counts as on the power glyph. */
const glyphZone = 70;
/** How far a press on the glyph may travel before it stops being a tap. */
const tapSlop = 6;
const keyStep = 1;
const pageStep = 10;

interface BrightnessSliderProps {
  value: number;
  color: string;
  icon: IconName;
  label: string;
  powerLabel: string;
  on: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
  onToggle: () => void;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * A tall dimming pill that fills from the bottom. Safari 12 has no pointer events and no vertical
 * range input, so it reads touch and mouse events itself; the glyph at the bottom toggles power.
 */
export function BrightnessSlider({
  value,
  color,
  icon,
  label,
  powerLabel,
  on,
  disabled = false,
  onChange,
  onToggle,
}: BrightnessSliderProps) {
  const track = useRef<HTMLDivElement>(null);
  const lastSent = useRef<number | null>(null);
  const stopMouse = useRef<(() => void) | null>(null);
  const gesture = useRef<{ startY: number; tap: boolean } | null>(null);
  const change = useRef(onChange);
  const toggle = useRef(onToggle);
  change.current = onChange;
  toggle.current = onToggle;

  useEffect(
    () => () => {
      stopMouse.current?.();
    },
    [],
  );

  const send = (next: number) => {
    if (next === lastSent.current) {
      return;
    }

    lastSent.current = next;
    change.current(next);
  };

  const sendAt = (clientY: number) => {
    const rect = track.current?.getBoundingClientRect();

    if (!rect || rect.height === 0) {
      return;
    }

    send(clamp(Math.round(((rect.bottom - clientY) / rect.height) * 100)));
  };

  // A press on the glyph is a tap that toggles power until the finger travels; past that it is a
  // drag like any other, so dimming can start from the bottom of the pill.
  const beginGesture = (clientX: number, clientY: number) => {
    const rect = track.current?.getBoundingClientRect();

    lastSent.current = null;

    if (!rect) {
      return;
    }

    const onGlyph =
      rect.bottom - clientY <= glyphZone &&
      Math.abs(clientX - (rect.left + rect.width / 2)) <= glyphZone / 2;

    gesture.current = { startY: clientY, tap: onGlyph };

    if (!onGlyph) {
      sendAt(clientY);
    }
  };

  const moveGesture = (clientY: number) => {
    const current = gesture.current;

    if (!current) {
      return;
    }

    if (current.tap) {
      if (Math.abs(clientY - current.startY) < tapSlop) {
        return;
      }

      current.tap = false;
    }

    sendAt(clientY);
  };

  const endGesture = () => {
    const current = gesture.current;

    gesture.current = null;

    if (current?.tap) {
      toggle.current();
    }
  };

  const handleMouseMove = (event: MouseEvent) => moveGesture(event.clientY);

  const handleMouseDown = (event: MouseEvent) => {
    if (disabled || event.button !== 0) {
      return;
    }

    event.preventDefault();
    track.current?.focus();
    beginGesture(event.clientX, event.clientY);

    const stop = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stop);
      stopMouse.current = null;
      endGesture();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stop);
    stopMouse.current = stop;
  };

  // Cancelling the touch keeps the page and the modal from scrolling under the finger and stops
  // Safari from replaying the touch as emulated mouse events.
  const handleTouch = (event: TouchEvent) => {
    const touch = event.touches[0];

    if (disabled || !touch) {
      return;
    }

    event.preventDefault();

    if (event.type === 'touchstart') {
      beginGesture(touch.clientX, touch.clientY);
    } else {
      moveGesture(touch.clientY);
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    event.preventDefault();

    if (event.type === 'touchend') {
      endGesture();
    } else {
      gesture.current = null;
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const steps: Record<string, number> = {
      ArrowUp: keyStep,
      ArrowRight: keyStep,
      ArrowDown: -keyStep,
      ArrowLeft: -keyStep,
      PageUp: pageStep,
      PageDown: -pageStep,
    };
    const step = steps[event.key];
    let next: number | undefined;

    if (disabled) {
      return;
    }

    if (step !== undefined) {
      next = clamp(value + step);
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = 100;
    }

    if (next === undefined) {
      return;
    }

    event.preventDefault();
    lastSent.current = null;
    send(next);
  };

  const filled = value >= glyphOnFillFrom;

  return (
    <div class={styles.pill}>
      <button
        type="button"
        id="sheet-power"
        class={styles.power}
        style={{ color: filled && on ? glyphOn(color) : undefined }}
        aria-label={powerLabel}
        aria-pressed={on}
        disabled={disabled}
        onClick={onToggle}
      >
        <Icon name={icon} className={styles.icon} />
      </button>
      <div
        class={styles.track}
        id="brightness"
        ref={track}
        // Safari 12 cannot draw a vertical native range input, so the slider role stays on a div.
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value}%`}
        aria-disabled={disabled}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onKeyDown={handleKeyDown}
      >
        <div class={styles.fill} style={{ background: color, height: `${value}%` }} />
      </div>
    </div>
  );
}
