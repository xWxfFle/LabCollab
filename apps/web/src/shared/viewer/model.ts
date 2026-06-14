import { createEvent, createStore, sample } from 'effector';
import type { UserDto } from '@labcollab/shared';
import { appStarted } from '../init';
import { TOKEN_KEY } from '../api/base';
import { viewerQuery } from '../api/auth';
import { routes } from '../routing';

export type ViewerStatus = 'Initial' | 'Pending' | 'Authenticated' | 'Anonymous';

const hasStoredToken = () =>
  typeof localStorage !== 'undefined' && !!localStorage.getItem(TOKEN_KEY);

export const tokenSet = createEvent<string>();
export const viewerAuthenticated = createEvent<UserDto>();
export const viewerSignedOut = createEvent();
export const signedOut = createEvent();

export const $token = createStore<string | null>(hasStoredToken() ? localStorage.getItem(TOKEN_KEY) : null);

$token.on(tokenSet, (_, token) => {
  localStorage.setItem(TOKEN_KEY, token);
  return token;
});

$token.on(viewerSignedOut, () => {
  localStorage.removeItem(TOKEN_KEY);
  return null;
});

export const $viewer = createStore<UserDto | null>(null);

$viewer.on(viewerQuery.finished.success, (_, payload) => {
  const result = payload.result as { user: UserDto };
  return result.user;
});
$viewer.on(viewerAuthenticated, (_, user) => user);
$viewer.reset(viewerSignedOut);

export const $viewerStatus = createStore<ViewerStatus>(hasStoredToken() ? 'Initial' : 'Anonymous');

$viewerStatus.on(viewerQuery.$pending, (status) => {
  if (status === 'Initial') {
    return 'Pending';
  }
  return status;
});

$viewerStatus.on(viewerQuery.finished.success, () => 'Authenticated');
$viewerStatus.on(viewerAuthenticated, () => 'Authenticated');

$viewerStatus.on(viewerQuery.finished.failure, (status) => {
  if (status === 'Pending' || status === 'Initial') {
    return 'Anonymous';
  }
  return status;
});

$viewerStatus.on(viewerSignedOut, () => 'Anonymous');

sample({
  clock: appStarted,
  source: $token,
  filter: Boolean,
  target: viewerQuery.start,
});

sample({
  clock: signedOut,
  target: viewerSignedOut,
});

sample({
  clock: viewerSignedOut,
  fn: () => ({ query: {} }),
  target: routes.login.open,
});

export { viewerQuery };
