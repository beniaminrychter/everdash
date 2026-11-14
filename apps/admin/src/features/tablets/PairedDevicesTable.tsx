import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PairedDevice } from './useTabletAccess';

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function PairedDevicesTable({ devices }: { devices: PairedDevice[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paired devices</CardTitle>
        <CardDescription>Devices that were paired with this EverDash.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Paired</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-medium">{device.label || 'Unnamed device'}</TableCell>
                <TableCell>{formatDate(device.createdAt)}</TableCell>
                <TableCell>
                  {device.revokedAt ? (
                    <Badge variant="outline">Revoked</Badge>
                  ) : (
                    <Badge variant="secondary">Active until {formatDate(device.expiresAt)}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
