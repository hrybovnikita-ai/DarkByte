import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import IntegratedCheckout from "@/components/billing/IntegratedCheckout";

export default function StripeEmbeddedCheckoutPage() {
  return (
    <div className="min-h-screen bg-[#050508] font-mono text-white">
      <SiteHeader />
      <IntegratedCheckout forcedMode="stripe" />
      <SiteFooter />
    </div>
  );
}