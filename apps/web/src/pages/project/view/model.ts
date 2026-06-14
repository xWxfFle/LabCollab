import { debouncedRouteOpened, routes } from '@/shared/routing';
import { chainAuthenticated } from '@/shared/viewer';

export const currentRoute = routes.projectView;
export const authenticatedRoute = chainAuthenticated(currentRoute);
export const routeOpened = debouncedRouteOpened(currentRoute);
