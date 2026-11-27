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

export type DashboardAddressReasonCode =
  | 'connection_refused'
  | 'timeout'
  | 'dns_failed'
  | 'tls_error'
  | 'wrong_service'
  | 'network_unreachable'
  | 'unknown';

export interface DashboardAddressInfo {
  url: string;
  reachable: boolean;
  reasonCode?: DashboardAddressReasonCode;
  httpStatus?: number;
}

export interface DashboardAddressesResponse {
  local: DashboardAddressInfo | null;
  external: DashboardAddressInfo | null;
}
