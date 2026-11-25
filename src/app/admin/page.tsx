import AdminDashboard from "@/components/admin/AdminDashboard";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#080808] font-mono text-white">
      <SiteHeader />
      <AdminDashboard />
      <SiteFooter />
    </div>
  );
}