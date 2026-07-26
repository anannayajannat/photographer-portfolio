import { withAuth } from "next-auth/middleware";

// withAuth redirects unauthenticated requests to /admin/login automatically.
// This runs BEFORE any admin page component renders, so there's no flash
// of protected content and no reliance on client-side route guards.
export default withAuth({
  pages: { signIn: "/admin/login" },
});

// Deliberately does NOT include /api/* here: those routes have public GET
// methods (gallery listing, CMS content) alongside admin-only mutations.
// Blanket-protecting the path would 401 legitimate public reads. Instead,
// every mutating API route calls requireAdmin() itself (see requireAdmin.ts)
// — auth is enforced per-operation, not per-path.
export const config = {
  matcher: ["/admin/((?!login).*)"],
};
