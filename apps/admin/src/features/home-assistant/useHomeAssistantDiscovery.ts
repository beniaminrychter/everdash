import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiscoveredHomeAssistant } from '@everdash/contracts/auth/oauth';
import { discoverHomeAssistantInstances } from './connectionActions';

interface DiscoveryState {
  instances: DiscoveredHomeAssistant[];
  scanning: boolean;
  scannedOnce: boolean;
  error: string;
}

export function sourceLabel(source: DiscoveredHomeAssistant['source']): string {
  switch (source) {
    case 'mdns': {
      return 'mDNS';
    }

    case 'local': {
      return 'Local';
    }

    default: {
      return 'Network';
    }
  }
}

export function instanceOrigins(instance: DiscoveredHomeAssistant): string[] {
  const seen = new Set<string>();
  const origins: string[] = [];

  for (const candidate of [instance.origin, ...(instance.origins ?? [])]) {
    if (candidate && !seen.has(candidate)) {
      seen.add(candidate);
      origins.push(candidate);
    }
  }

  return origins;
}

export function useHomeAssistantDiscovery(
  enabled: boolean,
  onDiscovered?: (instances: DiscoveredHomeAssistant[]) => void,
) {
  const [state, setState] = useState<DiscoveryState>({
    instances: [],
    scanning: enabled,
    scannedOnce: false,
    error: '',
  });
  const onDiscoveredRef = useRef(onDiscovered);
  const controllerRef = useRef<AbortController | null>(null);
  const scanGenerationRef = useRef(0);

  useEffect(() => {
    onDiscoveredRef.current = onDiscovered;
  }, [onDiscovered]);

  const startScan = useCallback(async (signal?: AbortSignal) => {
    const generation = scanGenerationRef.current + 1;

    scanGenerationRef.current = generation;

    try {
      const instances = await discoverHomeAssistantInstances(signal);

      if (signal?.aborted || scanGenerationRef.current !== generation) {
        return;
      }

      setState({ instances, scanning: false, scannedOnce: true, error: '' });
      onDiscoveredRef.current?.(instances);
    } catch (error) {
      if (signal?.aborted || scanGenerationRef.current !== generation) {
        return;
      }

      setState((previous) => ({
        ...previous,
        scanning: false,
        scannedOnce: true,
        error:
          error instanceof Error
            ? error.message
            : 'Could not scan the local network for Home Assistant.',
      }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    controllerRef.current = controller;

    async function runInitialScan() {
      try {
        const instances = await discoverHomeAssistantInstances(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setState({ instances, scanning: false, scannedOnce: true, error: '' });
        onDiscoveredRef.current?.(instances);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState((previous) => ({
          ...previous,
          scanning: false,
          scannedOnce: true,
          error:
            error instanceof Error
              ? error.message
              : 'Could not scan the local network for Home Assistant.',
        }));
      }
    }

    void runInitialScan();

    return () => {
      controller.abort();
    };
  }, [enabled]);

  const rescan = useCallback(() => {
    if (!enabled) {
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();

    controllerRef.current = controller;
    setState((previous) => ({ ...previous, scanning: true, error: '' }));
    void startScan(controller.signal);
  }, [enabled, startScan]);

  return {
    instances: state.instances,
    scanning: enabled ? state.scanning : false,
    scannedOnce: state.scannedOnce,
    error: state.error,
    rescan,
  };
}
