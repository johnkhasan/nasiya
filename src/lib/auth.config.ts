import type { NextAuthConfig } from "next-auth";

// Edge-runtime-safe config: no Prisma / bcrypt here (middleware can't run
// Node.js modules). The Credentials provider with DB access lives in
// auth.ts, which is only imported from Node.js runtime code.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.shopId = user.shopId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string | undefined) ?? "";
        session.user.shopId = (token.shopId as string | undefined) ?? "";
        session.user.role = (token.role as string | undefined) ?? "owner";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
