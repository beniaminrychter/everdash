export interface DemoDevice {
  id: string;
  name: string;
  type: 'light' | 'outlet';
  on: boolean;
  brightness: number;
  lastBrightness: number;
  color?: string;
}

const definitions: readonly DemoDevice[] = [
  {
    id: 'floor-lamp',
    name: 'Floor lamp',
    type: 'light',
    on: true,
    brightness: 65,
    lastBrightness: 65,
  },
  {
    id: 'sofa-light',
    name: 'Sofa light',
    type: 'light',
    on: true,
    brightness: 70,
    lastBrightness: 70,
    color: '#a17af5',
  },
  {
    id: 'kitchen-light',
    name: 'Kitchen light',
    type: 'light',
    on: true,
    brightness: 80,
    lastBrightness: 80,
  },
  {
    id: 'table-light',
    name: 'Table light',
    type: 'light',
    on: true,
    brightness: 60,
    lastBrightness: 60,
  },
  {
    id: 'terrace-outlet',
    name: 'Terrace outlet',
    type: 'outlet',
    on: false,
    brightness: 0,
    lastBrightness: 0,
  },
  {
    id: 'bedside-light',
    name: 'Bedside light',
    type: 'light',
    on: true,
    brightness: 55,
    lastBrightness: 55,
  },
  {
    id: 'tv-outlet',
    name: 'TV outlet',
    type: 'outlet',
    on: true,
    brightness: 0,
    lastBrightness: 0,
  },
  {
    id: 'ceiling-light',
    name: 'Ceiling light',
    type: 'light',
    on: true,
    brightness: 90,
    lastBrightness: 90,
  },
];

export function createDevices(): DemoDevice[] {
  return definitions.map((device) => ({ ...device }));
}
