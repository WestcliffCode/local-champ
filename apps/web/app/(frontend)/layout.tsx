import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: {
    default: 'LocalGem',
    template: '%s · LocalGem',
  },
  description:
    'Discover and champion the best local businesses in your community.',
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
