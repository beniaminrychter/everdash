import { render } from 'preact';
import { App } from './App';
import { registerWorker } from './registerWorker';
import { removeReloadMarker } from './hardReload';
import { PairingPage } from '../features/pairing/components/PairingPage/PairingPage';
import { validateDashboard } from '../shared/config/validate';

interface BootstrapResponse {
  mode?: 'direct' | 'management';
  configured?: boolean;
  config?: unknown;
}

removeReloadMarker();
const root = document.querySelector('#app')!;

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
    render(
      <App
        config={parsed.config}
        mode={response.mode === 'management' ? 'management' : 'direct'}
      />,
      root,
    );
    if (response.mode !== 'management') {
      registerWorker();
    }
  });
  xhr.addEventListener('error', () => {
    render(<PairingPage mode="error" onRetry={loadDashboard} />, root);
  });
  xhr.addEventListener('timeout', () => {
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
