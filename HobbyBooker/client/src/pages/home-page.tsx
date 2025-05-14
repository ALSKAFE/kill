import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import DashboardStats from "@/components/dashboard/stats";
import Calendar from "@/components/calendar/calendar";
import RecentBookings from "@/components/bookings/recent-bookings";
import { useQuery } from "@tanstack/react-query";
import { Stats } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  
  // Fetch stats for dashboard
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });
  
  // Refetch stats when the component mounts
  useEffect(() => {
    refetchStats();
  }, [refetchStats]);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard Stats */}
        <DashboardStats stats={stats} isLoading={isLoadingStats} />
        
        {/* Calendar Section */}
        <Calendar />
        
        {/* Recent Bookings Table */}
        <RecentBookings />
      </main>
    </div>
  );
}
