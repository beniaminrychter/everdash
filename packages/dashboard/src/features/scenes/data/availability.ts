import type { Entity } from '../../../shared/home-assistant/entities';

/**
 * A scene or script cannot be run when Home Assistant does not know it or reports it unavailable.
 * A never-activated scene legitimately reports "unknown" and must stay tappable.
 */
export function sceneUnavailable(entity: Entity | undefined, ready: boolean): boolean {
  if (!ready) {
    return false;
  }

  return !entity || entity.state.toLowerCase().trim() === 'unavailable';
}
