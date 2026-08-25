import React from 'react';

interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  staggerIndex?: number;
  staggerDelayMs?: number;
  as?: React.ElementType;
}

/**
 * Reusable ScrollReveal wrapper component
 * Wraps any section, card, or element with `.scroll-reveal` and an optional stagger index.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  staggerIndex = 0,
  staggerDelayMs = 140,
  as: Component = 'div',
  style,
  ...props
}) => {
  const delay = staggerIndex > 0 ? `${staggerIndex * staggerDelayMs}ms` : undefined;

  return (
    <Component
      data-scroll-reveal="true"
      className={`scroll-reveal ${className}`}
      style={{
        ...(delay ? { '--reveal-delay': delay } : {}),
        ...style
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </Component>
  );
};
