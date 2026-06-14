import { createForm } from '@effector-reform/core';
import { zodAdapter } from '@effector-reform/zod';
import { sample } from 'effector';
import { loginSchema } from '@labcollab/shared';
import { loginMutation } from '@/shared/api/auth';
import { debouncedRouteOpened, routes } from '@/shared/routing';
import { chainAnonymous, tokenSet, viewerAuthenticated } from '@/shared/viewer';

export const currentRoute = routes.login;
export const anonymousRoute = chainAnonymous(currentRoute);
export const routeOpened = debouncedRouteOpened(currentRoute);

export const form = createForm({
  schema: {
    email: 'alice@lab.local',
    password: 'password123',
  },
  validation: zodAdapter(loginSchema),
});

sample({
  clock: form.validatedAndSubmitted,
  target: loginMutation.start,
});

sample({
  clock: loginMutation.finished.success,
  fn: ({ result }) => result.accessToken,
  target: tokenSet,
});

sample({
  clock: loginMutation.finished.success,
  fn: ({ result }) => result.user,
  target: viewerAuthenticated,
});

sample({
  clock: loginMutation.finished.success,
  fn: () => ({ query: {} }),
  target: routes.dashboard.open,
});

sample({
  clock: loginMutation.finished.failure,
  fn: () => ({
    errors: {
      email: 'Неверные данные для входа',
      password: 'Неверные данные для входа',
    },
  }),
  target: form.fill,
});

sample({
  clock: currentRoute.closed,
  target: form.reset,
});
