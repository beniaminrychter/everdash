import { h } from 'preact';
import type { IconName } from '@everdash/contracts/iconNames';
import { iconShapes, iconSvgAttributes } from './iconShapes';
import styles from './Icon.module.css';

export type { IconName } from '@everdash/contracts/iconNames';

interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon({ name, className = '' }: IconProps) {
  const shapes = iconShapes[name].map(([tag, attributes]) => h(tag, attributes));

  return (
    <svg class={`${styles.icon} ${className}`} {...iconSvgAttributes} aria-hidden="true">
      {shapes}
    </svg>
  );
}
