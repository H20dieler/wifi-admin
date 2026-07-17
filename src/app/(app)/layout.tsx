import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/get-current-admin";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  // Middleware already handles this in practice — this is the fallback for
  // a valid session with no matching admin_profiles row.
  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={admin.role} />
      <div className="flex flex-1 flex-col">
        <Topbar admin={admin} />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
