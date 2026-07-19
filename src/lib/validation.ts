import { z } from "zod";

// Loose E.164-ish check — this app has Uzbek shops in mind but shouldn't
// hard-reject a foreign number typed in a slightly different format.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{9,15}$/, "Telefon raqam noto'g'ri formatda");
