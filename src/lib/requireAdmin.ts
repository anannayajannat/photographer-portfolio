import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Every mutating admin route calls this FIRST, server-side. We never trust
 * a client-side "isAdmin" flag or hidden form field — session is re-checked
 * on every request because the client can't be trusted to enforce this.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return session;
}
