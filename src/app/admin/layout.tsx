import AuthProvider from "@/components/AuthProvider";
import AdminChrome from "@/components/AdminChrome";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminChrome>{children}</AdminChrome>
    </AuthProvider>
  );
}
