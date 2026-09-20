'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BusFront, Ticket, CheckSquare, Wallet, ArrowUpRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data: profile } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/profile');
      return res.data;
    }
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors-stats'],
    queryFn: async () => (await apiClient.get('/admin/vendors')).data
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings-stats'],
    queryFn: async () => (await apiClient.get('/admin/bookings')).data
  });

  const { data: approvals } = useQuery({
    queryKey: ['approvals-stats'],
    queryFn: async () => (await apiClient.get('/admin/approvals')).data
  });

  const { data: payouts } = useQuery({
    queryKey: ['payouts-stats'],
    queryFn: async () => (await apiClient.get('/admin/payouts')).data
  });

  const totalVendors = vendors?.length || 0;
  const totalBookings = bookings?.length || 0;
  
  // Pending approvals (status === 'pending')
  const pendingApprovals = approvals?.filter((a: any) => a.status === 'pending') || [];
  
  // Pending payouts (assuming payouts that are not 'completed')
  const pendingPayoutsList = payouts?.filter((p: any) => p.status === 'pending' || p.status === 'processing') || [];
  const pendingPayoutsTotal = pendingPayoutsList.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-blue-600 p-8 text-primary-foreground shadow-lg">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Welcome back, {profile?.first_name || 'Admin'} 👋
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl">
            Here is what's happening on your platform today. You have <strong className="text-white">{pendingApprovals.length} pending approvals</strong> requiring your attention.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20">
          <div className="w-64 h-64 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 opacity-10">
          <div className="w-48 h-48 rounded-full bg-white blur-2xl"></div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Pending Approvals" 
          value={pendingApprovals.length.toString()} 
          description="Require Maker-Checker review" 
          icon={CheckSquare}
          trend="Review queue"
          trendUp={pendingApprovals.length === 0}
          colorClass="bg-orange-500/10 text-orange-600"
        />
        <MetricCard 
          title="Total Bookings" 
          value={totalBookings.toString()} 
          description="Lifetime bookings tracked" 
          icon={Ticket}
          trend="Real-time"
          trendUp={true}
          colorClass="bg-blue-500/10 text-blue-600"
        />
        <MetricCard 
          title="Total Vendors" 
          value={totalVendors.toString()} 
          description="Active supply partners" 
          icon={Users}
          trend="Real-time"
          trendUp={true}
          colorClass="bg-emerald-500/10 text-emerald-600"
        />
        <MetricCard 
          title="Pending Payouts" 
          value={`₹${pendingPayoutsTotal.toLocaleString()}`} 
          description={`${pendingPayoutsList.length} transactions pending`} 
          icon={Wallet}
          trend="Due processing"
          trendUp={pendingPayoutsTotal === 0}
          colorClass="bg-rose-500/10 text-rose-600"
        />
      </div>

      {/* Quick Activity Section (Placeholder for future charts/tables) */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-4 pt-6 px-6">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Platform Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-b from-transparent to-muted/20">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BarChartIcon className="w-8 h-8 opacity-50" />
              </div>
              <p>Activity visualization rendering...</p>
              <p className="text-xs mt-1">Detailed charts will appear here when enough data is collected.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-4 pt-6 px-6">
            <CardTitle>Recent Approvals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {approvals?.slice(0, 5).map((approval: any) => (
                <div key={approval.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium">{approval.resource_type.toUpperCase()} #{approval.id.substring(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">Requested by {approval.maker_id || 'System'}</p>
                  </div>
                  <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
              {approvals?.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">No recent approvals found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, value, description, icon: Icon, trend, trendUp, colorClass 
}: { 
  title: string, value: string, description: string, icon: any, trend: string, trendUp: boolean, colorClass: string 
}) {
  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6 px-6 bg-gradient-to-b from-muted/30 to-transparent">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-6 pb-6">
        <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
        <div className={cn(
          "inline-flex items-center text-xs font-medium px-2 py-1 rounded-md",
          trendUp ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
        )}>
          {trend}
        </div>
      </CardContent>
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </Card>
  );
}

function BarChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}
