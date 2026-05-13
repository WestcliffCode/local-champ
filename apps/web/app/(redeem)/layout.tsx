import type { ReactNode } from 'react';
import { Space_Grotesk, Manrope } from 'next/font/google';
import '../globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export default function RedeemLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <body className="antialiased bg-background min-h-screen">
        {children}
      </body>
    </html>
  );
}
