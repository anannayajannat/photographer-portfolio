import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { loginLimit, isRateLimited } from "./rateLimit";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // The one auth entry point in the app — brute-force protection
        // here matters more than anywhere else in the system. Checked
        // BEFORE the DB lookup / bcrypt compare, so a locked-out attacker
        // can't even spend our compute guessing.
        const ip =
          (req?.headers as Record<string, string> | undefined)?.["x-forwarded-for"]
            ?.split(",")[0]
            .trim() ?? "unknown";
        const blocked = await isRateLimited(loginLimit, `${credentials.email}:${ip}`);
        if (blocked) return null;

        const [admin] = await db
          .select()
          .from(schema.admins)
          .where(eq(schema.admins.email, credentials.email));
        if (!admin) return null;

        const valid = await bcrypt.compare(credentials.password, admin.passwordHash);
        if (!valid) return null;

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
  },
};
