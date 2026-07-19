import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
      <Link href="/" className="font-semibold">
        Nasiya
      </Link>
      <nav className="flex items-center gap-3">
        <Link
          href="/pricing"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Narxlar
        </Link>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/login">Kirish</Link>}
        />
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/register">Ro&apos;yxatdan o&apos;tish</Link>}
        />
      </nav>
    </header>
  );
}
