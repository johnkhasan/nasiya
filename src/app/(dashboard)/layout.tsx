import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { DashboardNav } from "./dashboard-nav";
import { ProfileMenu } from "./profile-menu";

const NAV_LINKS = [
  { href: "/dashboard", label: "Bosh sahifa" },
  { href: "/customers", label: "Mijozlar" },
];

const OWNER_NAV_LINKS = [{ href: "/staff", label: "Xodimlar" }];

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

  const profileMenu = (
    <ProfileMenu
      fullName={session.user.name ?? ""}
      phone={session.user.phone}
      role={session.user.role}
      onSignOut={handleSignOut}
    />
  );

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold">Nasiya</span>
          <div className="sm:hidden">{profileMenu}</div>
        </div>
        <DashboardNav links={links} />
        <div className="hidden sm:ml-auto sm:block">{profileMenu}</div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
