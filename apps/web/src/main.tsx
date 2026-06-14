import { allSettled, fork } from 'effector';
import { Provider } from 'effector-react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/app';
import { appStarted } from './shared/init';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root not found');
}

async function render() {
  const scope = fork();

  await allSettled(appStarted, { scope });

  createRoot(root!).render(
    <StrictMode>
      <Provider value={scope}>
        <App />
      </Provider>
    </StrictMode>,
  );
}

render().catch(() => console.error('Failed to render the app'));
