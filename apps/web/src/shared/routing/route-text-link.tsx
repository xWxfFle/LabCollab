import type { Route } from '@argon-router/core';
import { useLink, useRouter } from '@argon-router/react';
import type { TextProps } from '@mantine/core';
import { Text } from '@mantine/core';
import type { MouseEvent } from 'react';

type RouteTextLinkProps<Params extends object | void = void> = {
  to: Route<Params>;
  params?: Params extends void | undefined ? never : Params;
  children: React.ReactNode;
} & TextProps;

/** Текстовая ссылка с навигацией argon-router. */
export function RouteTextLink<Params extends object | void = void>({
  to,
  params,
  children,
  ...textProps
}: RouteTextLinkProps<Params>) {
  const { path } = useLink(to, params as never);
  const { onNavigate } = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented
      || event.metaKey
      || event.altKey
      || event.ctrlKey
      || event.shiftKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate({ path, query: {} });
  };

  return (
    <Text
      component="a"
      href={path}
      onClick={handleClick}
      style={{ textDecoration: 'none', cursor: 'pointer' }}
      {...textProps}
    >
      {children}
    </Text>
  );
}
