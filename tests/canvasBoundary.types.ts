import type * as admin from '../apps/admin/src/types/mountDashboardCanvas';
import type * as real from '@everdash/dashboard/editor/mountDashboardCanvas';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// Checked by tsc, never bundled or executed. The admin compiles against a
// declaration-only copy of the Preact canvas boundary; these fail on drift.
const boundary: [
  Equal<admin.DashboardCanvasProps, real.DashboardCanvasProps>,
  Equal<admin.CanvasHandle, real.CanvasHandle>,
  Equal<typeof admin.mountDashboardCanvas, typeof real.mountDashboardCanvas>,
] = [true, true, true];

export { boundary };
