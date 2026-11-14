export interface Device {
  id: string;
  name: string;
  room: string;
  type: 'light' | 'outlet' | 'toggle';
  icon: string;
  on: boolean;
  brightness: number;
  lastBrightness: number;
  color: string;
  colorCapable: boolean;
  availability?: 'loading' | 'available' | 'unavailable' | 'missing' | 'error';
  dimmable?: boolean;
  pending?: boolean;
}
