'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface ScrollLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export default function ScrollLink({ href, className, children }: ScrollLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById(href.replace('#', ''));
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
} 