'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CreditCard, DollarSign, Users, TrendingUp, Globe, Loader2 } from 'lucide-react';
import { vendorsApi, subscriptionsApi, payoutsApi, referralsApi, seoBlogsApi } from '@/lib/api';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    vendors: 0,
    subscriptions: 0,
    payouts: 0,
    referrals: 0,
    blogs: 0,
    revenue: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [vendors, subscriptions, payouts, referrals, blogs] = await Promise.all([
          vendorsApi.findAll(),
          subscriptionsApi.findAll(),
          payoutsApi.findAll(),
          referralsApi.findAll(),
          seoBlogsApi.findAll(),
        ]);

        const totalRevenue = payouts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) + 
                            referrals.reduce((acc, curr) => acc + Number(curr.total_revenue_generated || 0), 0);

        setStats({
          vendors: vendors.length,
          subscriptions: subscriptions.length,
          payouts: payouts.length,
          referrals: referrals.length,
          blogs: blogs.length,
          revenue: totalRevenue,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">Holistic overview of system performance and activity.</p>
        </div>
      </div>
      
      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800">Total Vendors</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="h-4 w-4 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-950">{stats.vendors}</div>
            <p className="text-xs text-blue-600 mt-2 font-medium">Registered partners</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-emerald-100 bg-emerald-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-800">Active Subscriptions</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-full">
              <Activity className="h-4 w-4 text-emerald-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-950">{stats.subscriptions}</div>
            <p className="text-xs text-emerald-600 mt-2 font-medium">Currently active plans</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-violet-100 bg-violet-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-violet-800">Total Payouts</CardTitle>
            <div className="p-2 bg-violet-100 rounded-full">
              <CreditCard className="h-4 w-4 text-violet-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-950">{stats.payouts}</div>
            <p className="text-xs text-violet-600 mt-2 font-medium">Processed payments</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-100 bg-amber-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-amber-800">Total System Revenue</CardTitle>
            <div className="p-2 bg-amber-100 rounded-full">
              <DollarSign className="h-4 w-4 text-amber-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-950">₹{stats.revenue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-amber-600 mt-2 font-medium">Aggregated generated revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-6">Department Overviews</h3>
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* SEO Performance Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-gray-800">SEO & Content</CardTitle>
              <div className="p-2 bg-gray-100 rounded-full">
                <Globe className="h-5 w-5 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-2 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <span className="text-sm text-gray-600">Published Blogs & Guides</span>
                  <span className="font-bold">{stats.blogs}</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-sm text-gray-600">Total Organic Page Views</span>
                  <span className="font-bold">Pending Analytics</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Performance Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-gray-800">Sales & Referrals</CardTitle>
              <div className="p-2 bg-gray-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-2 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <span className="text-sm text-gray-600">Total Referrals Generated</span>
                  <span className="font-bold">{stats.referrals}</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-sm text-gray-600">Active Sales Executives</span>
                  <span className="font-bold text-green-600">12</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
