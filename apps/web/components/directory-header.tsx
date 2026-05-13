import Link from 'next/link';
import type { ReactNode } from 'react';

export interface DirectoryHeaderProps {
  authBadge?: ReactNode;
}

export function DirectoryHeader({ authBadge }: DirectoryHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant/50 glass-heavy">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-base font-bold tracking-tight text-foreground hover:text-diamond transition-colors"
        >
          LocalGem
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-diamond">
            Home
          </Link>
          <Link href="/about" className="transition-colors hover:text-diamond">
            About
          </Link>
          <Link href="/for-merchants" className="transition-colors hover:text-diamond">
            Partners
          </Link>
          <Link href="/admin" className="transition-colors hover:text-diamond">
            Dashboard
          </Link>
          {authBadge}
        </nav>
      </div>
    </header>
  );
}
