import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "./dashboard-nav";

const NAV_LINKS = [
  { href: "/dashboard", label: "Bosh sahifa" },
  { href: "/customers", label: "Mijozlar" },
];

const OWNER_NAV_LINKS = [{ href: "/settings", label: "Sozlamalar" }];

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const links =
    session.user.role === "owner"
      ? [...NAV_LINKS, ...OWNER_NAV_LINKS]
      : NAV_LINKS;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold">Nasiya</span>
          <form action={handleSignOut} className="sm:hidden">
            <Button variant="outline" size="sm" type="submit">
              Chiqish
            </Button>
          </form>
        </div>
        <DashboardNav links={links} />
        <form action={handleSignOut} className="hidden sm:ml-auto sm:block">
          <Button variant="outline" size="sm" type="submit">
            Chiqish
          </Button>
        </form>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
