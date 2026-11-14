/* oxlint-disable no-use-before-define -- Dashboard bootstrap and retry callbacks are mutually recursive. */
import { PinGate } from './PinGate';
import { render } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { App } from './App';
import { useRuntimeConfig } from './hooks/useRuntimeConfig';
import { registerWorker } from './registerWorker';
import { removeReloadMarker } from './hardReload';
import { StatusPage } from './StatusPage';
import { validateDashboard } from '@everdash/contracts/config/validate';
import type { RuntimeSnapshot } from '@everdash/dashboard/features/configuration/data/api';

interface BootstrapResponse {
  mode?: 'direct' | 'management';
  configured?: boolean;
  revision?: string;
  config?: unknown;
}

removeReloadMarker();

// Safari 12 only applies :active styles once a touch listener exists on the document.
document.addEventListener('touchstart', () => undefined, false);
const root = document.querySelector('#app')!;

function RuntimeApp({
  initial,
  mode,
  initiallyAuthorized = true,
  pinEnabled = false,
}: {
  initial: RuntimeSnapshot;
  mode: 'direct' | 'management';
  initiallyAuthorized?: boolean;
  pinEnabled?: boolean;
}) {
  const [accessLost, setAccessLost] = useState(false);
  const handleUnauthorized = useCallback(() => {
    setAccessLost(true);
    loadDashboard();
  }, []);
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
    return <p>Checking access…</p>;
  }
  const validated = validateDashboard(snapshot.config);
  if (!validated.ok) {
    return (
      <StatusPage mode="error" message="EverDash received an invalid dashboard configuration." />
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
      pinEnabled={pinEnabled}
    />
  );
}

function loadAuthorizedDashboard(pinEnabled = false) {
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
        <StatusPage
          mode="error"
          message="EverDash returned an invalid response."
          onRetry={loadDashboard}
        />,
        root,
      );
      return;
    }
    if (xhr.status === 401 && 'code' in response && response.code === 'TABLET_ACCESS_REQUIRED') {
      loadDashboard();
      return;
    }
    if (xhr.status === 401 && response.mode === 'management') {
      render(<StatusPage mode="management" />, root);
      return;
    }
    if (xhr.status < 200 || xhr.status >= 300) {
      const message =
        response && 'message' in response && typeof response.message === 'string'
          ? response.message
          : 'EverDash could not be reached. Check the connection and retry.';
      render(<StatusPage mode="error" message={message} onRetry={loadDashboard} />, root);
      return;
    }
    const parsed = validateDashboard(response.config);
    if (!parsed.ok) {
      render(
        <StatusPage
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
        pinEnabled={pinEnabled}
      />,
      root,
    );
    if (response.mode !== 'management') {
      registerWorker();
    }
  });
  xhr.addEventListener('error', () => {
    render(<StatusPage mode="error" onRetry={loadDashboard} />, root);
  });
  xhr.addEventListener('timeout', () => {
    render(
      <StatusPage
        mode="error"
        message="EverDash did not respond in time. Try again."
        onRetry={loadDashboard}
      />,
      root,
    );
  });
  xhr.send();
}

function offline() {
  render(<p>EverDash is offline. Reconnect and reload.</p>, root);
}

function loadDashboard() {
  const request = new XMLHttpRequest();
  request.open('GET', '/api/access');
  request.timeout = 10000;
  request.addEventListener('load', () => {
    try {
      const access = JSON.parse(request.responseText) as { status: string };
      if (access.status === 'open' || access.status === 'unlocked') {
        loadAuthorizedDashboard(access.status === 'unlocked');
      } else {
        render(
          <PinGate setupRequired={access.status === 'setup_required'} onUnlock={loadDashboard} />,
          root,
        );
      }
    } catch {
      render(<p>Cannot check dashboard access. Reload to retry.</p>, root);
    }
  });
  request.addEventListener('error', offline);
  request.addEventListener('timeout', offline);
  request.send();
}
window.addEventListener('everdash-lock', () => {
  render(<p>Locking…</p>, root);
  try {
    localStorage.removeItem('everdash:offline-config:v1');
  } catch {
    // Lock the server session even when browser storage is unavailable.
  }
  const request = new XMLHttpRequest();
  request.open('POST', '/api/access/lock');
  request.timeout = 10_000;
  request.setRequestHeader('X-EverDash-Request', '1');
  request.addEventListener('loadend', loadDashboard);
  request.send();
});
loadDashboard();
