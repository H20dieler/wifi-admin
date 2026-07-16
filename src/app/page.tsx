import { getCurrentAdmin } from "@/lib/get-current-admin";
import { LogoutButton } from "@/components/logout-button";

export default async function Home() {
  const admin = await getCurrentAdmin();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-2xl font-semibold text-foreground">
        WiFi Admin — Setup OK
      </h1>
      {admin && (
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <p>
            Signed in as{" "}
            <span className="text-foreground">
              {admin.full_name ?? admin.id}
            </span>{" "}
            ({admin.role})
          </p>
          <LogoutButton />
        </div>
      )}
    </main>
  );
}
