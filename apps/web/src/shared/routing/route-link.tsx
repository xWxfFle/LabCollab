import type { Route } from '@argon-router/core';
import { useLink, useRouter } from '@argon-router/react';
import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

type RouteLinkProps<Params extends object | void = void> = {
  to: Route<Params>;
  params?: Params extends void | undefined ? never : Params;
  children: ReactNode;
  boxProps?: BoxProps;
  style?: CSSProperties;
};

/** Ссылка с навигацией argon-router (Link.onOpen не срабатывает с Mantine в дереве). */
export function RouteLink<Params extends object | void = void>({
  to,
  params,
  children,
  boxProps,
  style,
}: RouteLinkProps<Params>) {
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

  const linkStyle: CSSProperties = {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    ...style,
  };

  if (boxProps) {
    return (
      <Box component="a" href={path} onClick={handleClick} {...boxProps} style={linkStyle}>
        {children}
      </Box>
    );
  }

  return (
    <a href={path} onClick={handleClick} style={linkStyle}>
      {children}
    </a>
  );
}
