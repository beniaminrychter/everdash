import { render } from 'preact';
import { App } from './App';
import { registerWorker } from './registerWorker';
import { removeReloadMarker } from './hardReload';
import example from '../../examples/dashboard.json';
import { validateDashboard } from '../shared/config/validate';

removeReloadMarker();
const initial = validateDashboard(example);
if (!initial.ok) {
  throw new Error('The bundled example dashboard configuration is invalid.');
}
render(<App config={initial.config} />, document.querySelector('#app')!);
registerWorker();
