import { render } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { App } from './App';
import { readOfflineRuntimeConfig, useRuntimeConfig } from './hooks/useRuntimeConfig';
import { registerWorker } from './registerWorker';
import { removeReloadMarker } from './hardReload';
import { PairingPage } from '../features/pairing/components/PairingPage/PairingPage';
import { validateDashboard } from '../shared/config/validate';
import type { RuntimeSnapshot } from '../features/configuration/data/api';

interface BootstrapResponse {
  mode?: 'direct' | 'management';
  configured?: boolean;
  revision?: string;
  config?: unknown;
}

removeReloadMarker();
const root = document.querySelector('#app')!;

function RuntimeApp({
  initial,
  mode,
  initiallyAuthorized = true,
}: {
  initial: RuntimeSnapshot;
  mode: 'direct' | 'management';
  initiallyAuthorized?: boolean;
}) {
  const [accessLost, setAccessLost] = useState(false);
  const handleUnauthorized = useCallback(() => setAccessLost(true), []);
  const { snapshot, publish, authorized } = useRuntimeConfig(
    initial,
    handleUnauthorized,
    initiallyAuthorized,
  );
  useEffect(() => {
    try {
      localStorage.setItem('everdash:offline-config:v1', JSON.stringify(initial));
    } catch {
      // The runtime dashboard remains available without offline layout storage.
    }
  }, [initial]);
  if (accessLost) {
    return <PairingPage mode={mode === 'direct' ? 'tablet' : 'management'} />;
  }
  const validated = validateDashboard(snapshot.config);
  if (!validated.ok) {
    return (
      <PairingPage mode="error" message="EverDash received an invalid dashboard configuration." />
    );
  }
  return (
    <App
      config={validated.config}
      dashboardDocument={snapshot.config}
      revision={snapshot.revision}
      mode={mode}
      onConfigPublished={publish}
      sessionAuthorized={authorized}
    />
  );
}

function loadDashboard() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'api/bootstrap');
  xhr.timeout = 10_000;
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.addEventListener('load', () => {
    let response: BootstrapResponse;
    try {
      response = JSON.parse(xhr.responseText) as BootstrapResponse;
    } catch {
      render(
        <PairingPage
          mode="error"
          message="EverDash returned an invalid response."
          onRetry={loadDashboard}
        />,
        root,
      );
      return;
    }
    if (xhr.status === 401 && response.mode === 'direct') {
      render(<PairingPage mode="tablet" />, root);
      return;
    }
    if (xhr.status === 401 && response.mode === 'management') {
      render(<PairingPage mode="management" />, root);
      return;
    }
    if (xhr.status < 200 || xhr.status >= 300) {
      const message =
        response && 'message' in response && typeof response.message === 'string'
          ? response.message
          : 'EverDash could not be reached. Check the connection and retry.';
      render(<PairingPage mode="error" message={message} onRetry={loadDashboard} />, root);
      return;
    }
    const parsed = validateDashboard(response.config);
    if (!parsed.ok) {
      render(
        <PairingPage
          mode="error"
          message="EverDash received an invalid dashboard configuration."
          onRetry={loadDashboard}
        />,
        root,
      );
      return;
    }
    const mode = response.mode === 'management' ? 'management' : 'direct';
    render(
      <RuntimeApp
        initial={{ revision: response.revision ?? 'unrevisioned', config: parsed.document }}
        mode={mode}
      />,
      root,
    );
    if (response.mode !== 'management') {
      registerWorker();
    }
  });
  xhr.addEventListener('error', () => {
    const cached = readOfflineRuntimeConfig();
    if (cached) {
      render(<RuntimeApp initial={cached} mode="direct" initiallyAuthorized={false} />, root);
      return;
    }
    render(<PairingPage mode="error" onRetry={loadDashboard} />, root);
  });
  xhr.addEventListener('timeout', () => {
    const cached = readOfflineRuntimeConfig();
    if (cached) {
      render(<RuntimeApp initial={cached} mode="direct" initiallyAuthorized={false} />, root);
      return;
    }
    render(
      <PairingPage
        mode="error"
        message="EverDash did not respond in time. Try again."
        onRetry={loadDashboard}
      />,
      root,
    );
  });
  xhr.send();
}

loadDashboard();
