/**
 * Require an environment variable at module load time.
 *
 * Returns the value as a non-nullable `string` so TypeScript control-flow
 * analysis treats it correctly across function-body boundaries.
 *
 * **Why this exists:** the obvious pattern —
 *
 * ```ts
 * const X = process.env.X;
 * if (!X) throw new Error(...);
 * export function fn() { useIt(X); } // TS: 'string | undefined'
 * ```
 *
 * — does NOT narrow `X` to `string` inside the function body. TypeScript's
 * flow analyzer narrows the const within the module-level scope after the
 * throw, but the narrowing does not propagate into nested closures defined
 * later in the file. The build then fails with `'string | undefined' is
 * not assignable to parameter of type 'string'` at the use site.
 *
 * Wrapping the read in a function whose return type is `string` fixes the
 * issue at the source: the calling `const` is typed `string` from
 * declaration time, so closures see `string` directly. No flow analysis
 * required.
 *
 * **Convention:** use this for any env var that the app cannot start
 * without. Pass `hint` for deploy-troubleshooting context — typically
 * "set in Vercel for Production + Preview + Development" per Workflow
 * Gotcha #9 in the handoff doc.
 */
export function requireEnv(name: string, hint?: string): string {
  const value = process.env[name];
  if (!value) {
    const suffix = hint ? ` ${hint}` : '';
    throw new Error(`Required env var ${name} is not set.${suffix}`);
  }
  return value;
}
