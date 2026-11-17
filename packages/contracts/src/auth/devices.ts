export interface RegisteredDevice {
  id: string;
  name: string;
  ip: string;
  deviceType: string;
  screenSize: string;
  registeredAt: number;
  lastSeenAt: number;
}

export interface DevicesOverview {
  registrationCode: string;
  codeCreatedAt: number;
  devices: RegisteredDevice[];
}

export interface TabletAccessResponse {
  status: 'registered' | 'registration_required';
}
