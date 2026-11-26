import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import CheckoutLauncher from "@/components/billing/CheckoutLauncher";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#080808] font-mono text-white">
      <SiteHeader />
      <CheckoutLauncher />
      <SiteFooter />
    </div>
  );
}