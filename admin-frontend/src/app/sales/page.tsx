import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react';

export default function SalesDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sales Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-100 bg-green-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">₹8,45,230</div>
            <p className="text-xs text-green-600 mt-1">+18% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">New Referrals</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">124</div>
            <p className="text-xs text-blue-600 mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className="border-orange-100 bg-orange-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">4.2%</div>
            <p className="text-xs text-orange-600 mt-1">+0.5% improvement</p>
          </CardContent>
        </Card>
        <Card className="border-purple-100 bg-purple-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">3</div>
            <p className="text-xs text-purple-600 mt-1">Running smoothly</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Chart Placeholders */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[250px] w-full flex items-center justify-center bg-gray-50 rounded text-gray-400 border border-dashed">
              Monthly Sales Chart Area
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">User #{5432 + i}</p>
                    <p className="text-gray-500 text-xs">Code: NIKLO{i}00</p>
                  </div>
                  <div className="font-bold">₹{12000 - (i * 1500)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
