import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Marketplace } from "@/components/buyer/marketplace";

export default function BuyerPage() {
  return (
    <DashboardLayout allowedRole="buyer">
      <div className="container mx-auto py-8">
        <Marketplace />
      </div>
    </DashboardLayout>
  );
}
