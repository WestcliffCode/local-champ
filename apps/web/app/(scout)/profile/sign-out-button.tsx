import { Button } from '@localchamp/ui';
import { signOut } from '@/lib/auth/actions';

/**
 * Sign-out button as a Server Component with a Server Action form action.
 *
 * No client interactivity required \u2014 form submit calls the server action,
 * which clears Supabase cookies via `@supabase/ssr` and then `redirect('/')`.
 * Next translates the redirect into a 303 response and the browser follows.
 *
 * Kept as a tiny dedicated component so the profile page reads cleanly and
 * the sign-out form's progressive-enhancement story (works without JS) is
 * obvious.
 */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline">
        Sign out
      </Button>
    </form>
  );
}
