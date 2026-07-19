"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TelegramConnect({
  connected,
  link,
}: {
  connected: boolean;
  link: string | null;
}) {
  const [copied, setCopied] = useState(false);

  if (connected) {
    return (
      <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        Telegram: ulangan
      </Badge>
    );
  }

  if (!link) {
    return (
      <p className="text-sm text-muted-foreground">
        Telegram bot sozlanmagan
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline">Telegram: ulanmagan</Badge>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Nusxalandi" : "Havolani nusxalash"}
      </Button>
    </div>
  );
}
