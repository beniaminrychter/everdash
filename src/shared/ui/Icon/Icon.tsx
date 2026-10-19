import type { ComponentChildren } from 'preact';
import styles from './Icon.module.css';

const shapes = {
  away: (
    <>
      <circle cx="14" cy="3" r="2" fill="currentColor" stroke="none" />
      <path d="m11 7 4 2 4 3m-8-5-3 6 4 4-3 6m4-12-1 6 5 5M8 9l-4 4" />
    </>
  ),
  bed: (
    <>
      <path d="M3 19v3m18-3v3M3 19v-8h18v8zM5 11V5h14v6M7 8h3m4 0h3" />
    </>
  ),
  bulb: (
    <>
      <path d="M8 16c0-3-3-4-3-8a7 7 0 0 1 14 0c0 4-3 5-3 8Z" fill="currentColor" stroke="none" />
      <path d="M9 19h6m-5 3h4" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 4 4L20 5" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M6 18 18 6" />
    </>
  ),
  cloud: (
    <>
      <path d="M6 18a4 4 0 0 1-.5-8 6.5 6.5 0 0 1 12.7-1.3A4.7 4.7 0 0 1 19 18Z" />
    </>
  ),
  coffee: (
    <>
      <path d="M5 8h11v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3zM16 10h2a3 3 0 0 1 0 6h-2M7 3v2m4-2v2m4-2v2" />
    </>
  ),
  'desk-lamp': (
    <>
      <path d="m7 11 8-8 6 6-8 8z" fill="currentColor" />
      <path d="m8 12-4 5v5m-2 0h12m-1-7-5 5" />
    </>
  ),
  'floor-lamp': (
    <>
      <path d="M6 3h12l4 11H2z" fill="currentColor" stroke-linejoin="round" />
      <path d="M12 14v8m-4 0h8" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5M5 9v12h5v-7h4v7h5V9" />
    </>
  ),
  laptop: (
    <>
      <path d="M5 3h14v14H5zM2 21h20M9 17v4m6-4v4" />
    </>
  ),
  moon: (
    <>
      <path d="M20.8 14.2A9 9 0 0 1 9.8 3.3a9 9 0 1 0 11 10.9Z" fill="currentColor" stroke="none" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </>
  ),
  movie: (
    <>
      <path d="m3 6 17-4 1 5-17 4zM4 11h17v10H4z" fill="currentColor" stroke="none" />
      <path d="m7 5 3 3m4-5 3 3" stroke="var(--movie-cutout, #143e49)" />
      <path d="m11 13 5 3-5 3z" fill="var(--movie-cutout, #143e49)" stroke="none" />
    </>
  ),
  outlet: (
    <>
      <rect x="3" y="2" width="18" height="20" rx="4" fill="currentColor" stroke="none" />
      <path d="M8 8v4m8-4v4m-5 5h2" stroke="var(--socket-cutout, #fff)" />
    </>
  ),
  pendant: (
    <>
      <path d="M12 1v6M3 17a9 9 0 0 1 18 0Z" fill="currentColor" />
      <path d="M10 21h4" />
    </>
  ),
  plug: (
    <>
      <path d="M8 2v6m8-6v6M5 8h14v5a7 7 0 0 1-14 0zM12 20v3" />
    </>
  ),
  rain: (
    <>
      <path d="M5 14a3.5 3.5 0 0 1 .5-7 6 6 0 0 1 11.7.5A3.5 3.5 0 1 1 19 14M7 17l-1 3m6-3-1 3m6-3-1 3" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V2m-4 4 4-4 4 4M5 10H3v12h18V10h-2" />
    </>
  ),
  sliders: (
    <>
      <path d="M3 6h8m4 0h6M3 12h2m4 0h12M3 18h11m4 0h3" />
      <circle cx="13" cy="6" r="2" />
      <circle cx="7" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </>
  ),
  sofa: (
    <>
      <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M5 18v3m14-3v3M3 11h3v4h12v-4h3v7H3z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </>
  ),
  sunrise: (
    <>
      <path d="M4 16a8 8 0 0 1 16 0M2 20h20M12 1v3M3 6l2 2m14 0 2-2M1 13h3m16 0h3" />
      <path d="M4 16h16" />
    </>
  ),
  thermometer: (
    <>
      <path d="M9 14.5V5a3 3 0 0 1 6 0v9.5a5 5 0 1 1-6 0Z" />
      <path d="M12 8v10m6-11h3m-3 4h2" />
    </>
  ),
} satisfies Record<string, ComponentChildren>;

export type IconName = keyof typeof shapes;

interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon({ name, className = '' }: IconProps) {
  return (
    <svg
      class={`${styles.icon} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {shapes[name]}
    </svg>
  );
}
