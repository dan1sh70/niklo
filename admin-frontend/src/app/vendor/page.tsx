import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, Map, FileText, CreditCard } from 'lucide-react';

export default function VendorDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-teal-100 bg-teal-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-800">Total Fleet</CardTitle>
            <Bus className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900">12</div>
            <p className="text-xs text-teal-600 mt-1">2 offline for maintenance</p>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Active Routes</CardTitle>
            <Map className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">8</div>
            <p className="text-xs text-blue-600 mt-1">+1 added this week</p>
          </CardContent>
        </Card>
        <Card className="border-orange-100 bg-orange-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">New Bookings</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">45</div>
            <p className="text-xs text-orange-600 mt-1">Today</p>
          </CardContent>
        </Card>
        <Card className="border-green-100 bg-green-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Earnings</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">₹1,24,500</div>
            <p className="text-xs text-green-600 mt-1">This Month</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Chart Placeholders */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[250px] w-full flex items-center justify-center bg-gray-50 rounded text-gray-400 border border-dashed">
              Revenue Chart Area
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">Booking #{8000 + i}</p>
                    <p className="text-sm text-gray-500">Delhi ➔ Jaipur</p>
                  </div>
                  <div className="font-medium text-sm">₹850</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
