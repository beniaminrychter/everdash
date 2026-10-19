import { render } from 'preact';
import { App } from './App';
import { registerWorker } from './registerWorker';
import { removeReloadMarker } from './hardReload';

removeReloadMarker();
render(<App />, document.querySelector('#app')!);
registerWorker();
