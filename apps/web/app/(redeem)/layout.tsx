import type { ReactNode } from 'react';
import '../globals.css';

export default function RedeemLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-background min-h-screen">
        {children}
      </body>
    </html>
  );
}
