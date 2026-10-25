import { signOut } from "@/lib/auth/actions";
import { strings } from "@/lib/strings";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="w-full border border-border py-3 font-mono text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
      >
        {strings.profile.logout}
      </button>
    </form>
  );
}
