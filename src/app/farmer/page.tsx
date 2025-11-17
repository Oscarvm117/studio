import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardStats } from "@/components/farmer/dashboard-stats";
import { LotManagement } from "@/components/farmer/lot-management";

export default function FarmerPage() {
  return (
    <DashboardLayout allowedRole="farmer">
      <div className="container mx-auto py-8">
        <div className="space-y-8">
          <DashboardStats />
          <LotManagement />
        </div>
      </div>
    </DashboardLayout>
  );
}
