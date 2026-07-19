"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

const PREFIX = "+998";

function extractLocalDigits(value: string): string {
  return value
    .replace(/^\+?998\s*/, "")
    .replace(/\D/g, "")
    .slice(0, 9);
}

function formatLocalDigits(digits: string): string {
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);
  return parts.join(" ");
}

export function PhoneInput({
  name,
  id,
  defaultValue,
  required,
}: {
  name: string;
  id?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [digits, setDigits] = useState(() => extractLocalDigits(defaultValue ?? ""));
  const display = `${PREFIX} ${formatLocalDigits(digits)}`.trimEnd();

  return (
    <>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={`${PREFIX} 90 123 45 67`}
        value={display}
        onChange={(event) => setDigits(extractLocalDigits(event.target.value))}
      />
      <input
        type="hidden"
        name={name}
        value={digits ? `${PREFIX}${digits}` : ""}
        required={required}
      />
    </>
  );
}
