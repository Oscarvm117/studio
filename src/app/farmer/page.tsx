import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LotManagement } from "@/components/farmer/lot-management";

export default function FarmerPage() {
  return (
    <DashboardLayout allowedRole="farmer">
      <div className="container mx-auto py-8">
        <LotManagement />
      </div>
    </DashboardLayout>
  );
}
