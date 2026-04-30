export default function HomePage() {
  return (
    <main className="container mx-auto px-6 py-24">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-forest-green">
          LocalChamp · v0.0.1
        </p>
        <h1 className="mt-4 text-5xl font-bold text-forest-green">
          Champion your community.
        </h1>
        <p className="mt-6 text-lg text-charcoal/80">
          Discover, claim, and reward the businesses that make your neighborhood
          worth living in.
        </p>
        <p className="mt-12 text-sm text-charcoal/60">
          Phase 1 · Payload CMS wired at{' '}
          <a className="underline underline-offset-2" href="/admin">
            /admin
          </a>
          . Directory routes arrive in Phase 2.
        </p>
      </div>
    </main>
  );
}
