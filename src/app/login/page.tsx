import { Wifi } from "lucide-react";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen">
      {/* The "cover" -- echoes the in-app sidebar's tone so sign-in reads
          as the same product, not a generic auth screen bolted on. */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-sidebar px-10 py-10 text-sidebar-foreground md:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(241,233,216,0.06) 32px)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Wifi className="size-72 text-primary/[0.13]" strokeWidth={1} />
        </div>
        <div className="relative flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <Wifi className="size-5 text-sidebar-primary" />
          WiFi Admin
        </div>
        <div className="relative max-w-xs space-y-2">
          <p className="font-mono text-xs uppercase tracking-wide text-sidebar-foreground/50">
            Customer &amp; billing ledger
          </p>
          <p className="text-sm text-sidebar-foreground/70">
            Customers, payments, inventory, and documents — one collection
            book, digitized.
          </p>
        </div>
      </div>

      {/* The "page" -- where you actually sign in. */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold text-foreground md:hidden">
            <Wifi className="size-5 text-primary" />
            WiFi Admin
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="mb-1 text-lg font-semibold text-foreground">
              Sign in
            </h1>
            <p className="mb-5 text-sm text-muted-foreground">
              Enter your admin credentials to continue.
            </p>
            <LoginForm error={error} />
          </div>
        </div>
      </div>
    </main>
  );
}
