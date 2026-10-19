import { createHash } from 'node:crypto';
import type { DashboardDocument } from '../../src/shared/config/types';

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

export function canonicalDashboardJson(document: DashboardDocument): string {
  return JSON.stringify(canonicalize(document));
}

export function dashboardRevision(document: DashboardDocument): string {
  return createHash('sha256').update(canonicalDashboardJson(document)).digest('hex');
}
