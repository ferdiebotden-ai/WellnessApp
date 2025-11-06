import React from 'react';

const createMockComponent = (name: string) =>
  // eslint-disable-next-line react/display-name
  (props: React.PropsWithChildren<Record<string, unknown>>) => React.createElement(name, props, props.children);

export default createMockComponent('Svg');
export const Svg = createMockComponent('Svg');
export const Circle = createMockComponent('Circle');
export const Text = createMockComponent('Text');
