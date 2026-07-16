import { logout } from "@/app/logout/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md border border-input px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
      >
        Log out
      </button>
    </form>
  );
}
