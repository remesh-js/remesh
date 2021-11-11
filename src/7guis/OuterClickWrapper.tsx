import React, { ComponentPropsWithoutRef, useEffect } from 'react';

export const OuterClickWrapper = (props: OuterClickWrapperProps) => {
  const { onOuterClick, ...restProps } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onOuterClick?.(event);
      }
    };
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return <div ref={containerRef} {...restProps}></div>;
};
type OuterClickWrapperProps = ComponentPropsWithoutRef<'div'> & {
  onOuterClick?: (event: MouseEvent) => void;
};
