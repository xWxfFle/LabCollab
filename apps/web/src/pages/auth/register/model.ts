import { createForm } from '@effector-reform/core';
import { zodAdapter } from '@effector-reform/zod';
import { sample } from 'effector';
import { registerSchema } from '@labcollab/shared';
import { registerMutation } from '@/shared/api/auth';
import { debouncedRouteOpened, routes } from '@/shared/routing';
import { chainAnonymous, tokenSet, viewerAuthenticated } from '@/shared/viewer';

export const currentRoute = routes.register;
export const anonymousRoute = chainAnonymous(currentRoute);
export const routeOpened = debouncedRouteOpened(currentRoute);

export const form = createForm({
  schema: {
    displayName: '',
    email: '',
    password: '',
  },
  validation: zodAdapter(registerSchema),
});

sample({
  clock: form.validatedAndSubmitted,
  target: registerMutation.start,
});

sample({
  clock: registerMutation.finished.success,
  fn: ({ result }) => result.accessToken,
  target: tokenSet,
});

sample({
  clock: registerMutation.finished.success,
  fn: ({ result }) => result.user,
  target: viewerAuthenticated,
});

sample({
  clock: registerMutation.finished.success,
  fn: () => ({ query: {} }),
  target: routes.dashboard.open,
});

sample({
  clock: registerMutation.finished.failure,
  fn: () => ({
    errors: {
      email: 'Ошибка регистрации',
    },
  }),
  target: form.fill,
});

sample({
  clock: currentRoute.closed,
  target: form.reset,
});
