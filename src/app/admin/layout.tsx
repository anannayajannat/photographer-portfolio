import AuthProvider from "@/components/AuthProvider";
import AdminChrome from "@/components/AdminChrome";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-scope min-h-screen bg-paper text-ink">
      <AuthProvider>
        <AdminChrome>{children}</AdminChrome>
      </AuthProvider>
    </div>
  );
}