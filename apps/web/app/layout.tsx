/**
 * Root pass-through layout.
 *
 * Each route group provides its own <html><body> shell:
 *   - (frontend)/layout.tsx — public-facing pages with Tailwind globals
 *   - (payload)/layout.tsx — Payload admin UI via @payloadcms/next/layouts
 *
 * This is the canonical pattern for embedding Payload inside a Next.js app
 * with conflicting style systems.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
