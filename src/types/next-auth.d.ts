import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    shopId: string;
    role: string;
  }

  interface Session {
    user: {
      shopId: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    shopId?: string;
    role?: string;
  }
}
