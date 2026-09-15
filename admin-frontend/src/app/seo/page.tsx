import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MousePointerClick, TrendingUp, Search } from 'lucide-react';

export default function SeoDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">SEO Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-indigo-100 bg-indigo-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Total Page Views</CardTitle>
            <Eye className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">45,231</div>
            <p className="text-xs text-indigo-600 mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Organic Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">12,543</div>
            <p className="text-xs text-blue-600 mt-1">+8% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-purple-100 bg-purple-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Avg Ranking Position</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">14.2</div>
            <p className="text-xs text-purple-600 mt-1">Improved by 2.1</p>
          </CardContent>
        </Card>
        <Card className="border-green-100 bg-green-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Active Keywords</CardTitle>
            <Search className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">342</div>
            <p className="text-xs text-green-600 mt-1">Top 100 results</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Top Performing Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">Bus from Delhi to Manali - Ultimate Guide</p>
                    <p className="text-gray-500 text-xs">/routes/delhi-manali</p>
                  </div>
                  <div className="font-bold">{12000 - (i * 1500)} views</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>SEO Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-sm">
                <strong>Missing Meta Description:</strong> 12 route pages are missing optimal meta descriptions.
              </div>
              <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm">
                <strong>Keyword Opportunity:</strong> &quot;Sleeper bus bangalore&quot; is trending. Consider creating content.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
