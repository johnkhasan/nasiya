import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    shopId: string;
    role: string;
    phone: string;
  }

  interface Session {
    user: {
      shopId: string;
      role: string;
      phone: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    shopId?: string;
    role?: string;
    phone?: string;
  }
}
