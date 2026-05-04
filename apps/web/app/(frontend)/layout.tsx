import type { Metadata } from 'next';
import '../globals.css';

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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
