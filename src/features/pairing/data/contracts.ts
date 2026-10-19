export interface DeviceInfo {
  id: string;
  label: string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}
