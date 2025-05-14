import { Stats } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CalendarCheck, Wallet, Calendar, Users } from "lucide-react";

interface DashboardStatsProps {
  stats?: Stats;
  isLoading: boolean;
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Today's Bookings */}
      <StatCard
        icon={<CalendarCheck className="h-5 w-5 text-white" />}
        iconBgColor="bg-primary"
        title="حجوزات اليوم"
        value={isLoading ? "..." : String(stats?.todayBookings || 0)}
        isLoading={isLoading}
      />
      
      {/* Total Payments */}
      <StatCard
        icon={<Wallet className="h-5 w-5 text-white" />}
        iconBgColor="bg-secondary"
        title="إجمالي المدفوعات"
        value={isLoading ? "..." : formatCurrency(stats?.totalPayments || 0)}
        isLoading={isLoading}
      />
      
      {/* Week Bookings */}
      <StatCard
        icon={<Calendar className="h-5 w-5 text-white" />}
        iconBgColor="bg-accent"
        title="حجوزات الأسبوع"
        value={isLoading ? "..." : String(stats?.weekBookings || 0)}
        isLoading={isLoading}
      />
      
      {/* Total Tenants */}
      <StatCard
        icon={<Users className="h-5 w-5 text-white" />}
        iconBgColor="bg-gray-500"
        title="إجمالي المستأجرين"
        value={isLoading ? "..." : String(stats?.totalTenants || 0)}
        isLoading={isLoading}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  value: string;
  isLoading: boolean;
}

function StatCard({ icon, iconBgColor, title, value, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            {icon}
          </div>
          <div className="mr-5">
            <div className="text-sm font-medium text-gray-500">{title}</div>
            {isLoading ? (
              <div className="mt-1 h-8 w-20 skeleton rounded"></div>
            ) : (
              <div className="mt-1 text-3xl font-semibold text-gray-900">{value}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
