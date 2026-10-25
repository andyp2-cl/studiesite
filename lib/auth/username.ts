// Students log in with a username; Supabase Auth needs an email, so we map
// usernames to an internal pseudo address that never receives mail.

export const PSEUDO_EMAIL_DOMAIN = "studiesite.local";

const USERNAME_PATTERN = /^[a-z0-9_.-]{2,32}$/;

/** Lower-cases and trims; returns null if the username is not allowed. */
export function normalizeUsername(input: string): string | null {
  const username = input.trim().toLowerCase();
  return USERNAME_PATTERN.test(username) ? username : null;
}

export function usernameToEmail(username: string): string {
  return `${username}@${PSEUDO_EMAIL_DOMAIN}`;
}
