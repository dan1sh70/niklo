/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { 
  ShoppingBag, 
  IndianRupee, 
  Users, 
  Store, 
  TrendingUp, 
  ArrowUpRight, 
  ChevronDown, 
  Plus, 
  Building2, 
  Bus, 
  Car, 
  Tag, 
  Wallet, 
  Bell, 
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: profile } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/profile');
        return res.data;
      } catch {
        return null;
      }
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

  const { data: users } = useQuery({
    queryKey: ['users-stats'],
    queryFn: async () => (await apiClient.get('/admin/users')).data
  });

  const totalVendors = vendors?.length || 318;
  const totalBookings = bookings?.length || 1482;
  const totalUsers = users?.length || 25680;
  const adminName = profile?.name?.split(' ')[0] || 'Yashasavi';

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. Header Greeting & Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            Good Morning, {adminName}! <span className="text-2xl">☀️</span>
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-0.5">
            Here's what's happening with Niklo today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-sm">
            <span>01 Oct 2026 - 14 Oct 2026</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards (4 columns exactly like Reference 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Bookings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Total Bookings</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-slate-900">
                {totalBookings.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18%</span>
                <span className="text-slate-400 font-normal">vs last 30 days</span>
              </div>
            </div>
            {/* Sparkline simulation */}
            <div className="w-16 h-8 text-blue-500">
              <svg viewBox="0 0 60 30" fill="none" className="w-full h-full stroke-current stroke-2">
                <path d="M0 25 Q 15 5, 30 18 T 60 10" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-slate-900">
                ₹12,46,230
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+24%</span>
                <span className="text-slate-400 font-normal">vs last 30 days</span>
              </div>
            </div>
            {/* Sparkline simulation */}
            <div className="w-16 h-8 text-emerald-500">
              <svg viewBox="0 0 60 30" fill="none" className="w-full h-full stroke-current stroke-2">
                <path d="M0 20 Q 15 28, 30 15 T 60 5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Total Users</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-slate-900">
                {totalUsers.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+32%</span>
                <span className="text-slate-400 font-normal">vs last 30 days</span>
              </div>
            </div>
            {/* Sparkline simulation */}
            <div className="w-16 h-8 text-indigo-500">
              <svg viewBox="0 0 60 30" fill="none" className="w-full h-full stroke-current stroke-2">
                <path d="M0 22 Q 20 8, 40 20 T 60 8" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Vendors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Active Vendors</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-slate-900">
                {totalVendors}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12%</span>
                <span className="text-slate-400 font-normal">vs last 30 days</span>
              </div>
            </div>
            {/* Sparkline simulation */}
            <div className="w-16 h-8 text-orange-500">
              <svg viewBox="0 0 60 30" fill="none" className="w-full h-full stroke-current stroke-2">
                <path d="M0 18 Q 20 25, 35 12 T 60 14" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Analytics Row: Bookings Overview (Line), Bookings by Service (Donut), Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bookings Overview (Line Chart) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Bookings Overview</h2>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span>Last 14 Days</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Service Legend Chips */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 mb-6">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>Bus</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Hotels</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>Cabs</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>Flights</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>Trains</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>Water Sports</span>
          </div>

          {/* Clean Graphic Curves SVG */}
          <div className="relative h-48 w-full">
            <svg viewBox="0 0 500 200" preserveAspectRatio="none" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="190" x2="500" y2="190" stroke="#f1f5f9" strokeWidth="1" />

              {/* Bus (Blue) Curve */}
              <path d="M 0 160 Q 70 80, 140 100 T 280 60 T 420 90 T 500 70" fill="none" stroke="#2563eb" strokeWidth="3" />
              {/* Hotels (Green) Curve */}
              <path d="M 0 180 Q 70 140, 140 130 T 280 120 T 420 110 T 500 130" fill="none" stroke="#10b981" strokeWidth="2.5" />
              {/* Cabs (Orange) Curve */}
              <path d="M 0 190 Q 70 170, 140 160 T 280 140 T 420 150 T 500 140" fill="none" stroke="#fb923c" strokeWidth="2" />
              {/* Water Sports (Cyan) Curve */}
              <path d="M 0 195 Q 70 185, 140 175 T 280 160 T 420 170 T 500 165" fill="none" stroke="#22d3ee" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-1">
            <span>1 Oct</span>
            <span>3 Oct</span>
            <span>5 Oct</span>
            <span>7 Oct</span>
            <span>9 Oct</span>
            <span>11 Oct</span>
            <span>13 Oct</span>
          </div>
        </div>

        {/* Bookings by Service (Donut) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 mb-2">Bookings by Service</h2>
          
          <div className="relative flex items-center justify-center my-4">
            {/* SVG Donut */}
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />
              {/* Bus Segment 38% */}
              <circle cx="50" cy="50" r="38" stroke="#2563eb" strokeWidth="14" fill="transparent"
                strokeDasharray="90.7 238.7" strokeDashoffset="0" />
              {/* Hotel Segment 22% */}
              <circle cx="50" cy="50" r="38" stroke="#10b981" strokeWidth="14" fill="transparent"
                strokeDasharray="52.5 238.7" strokeDashoffset="-90.7" />
              {/* Cabs 15% */}
              <circle cx="50" cy="50" r="38" stroke="#fb923c" strokeWidth="14" fill="transparent"
                strokeDasharray="35.8 238.7" strokeDashoffset="-143.2" />
              {/* Flights 10% */}
              <circle cx="50" cy="50" r="38" stroke="#a855f7" strokeWidth="14" fill="transparent"
                strokeDasharray="23.8 238.7" strokeDashoffset="-179" />
              {/* Trains 8% */}
              <circle cx="50" cy="50" r="38" stroke="#f43f5e" strokeWidth="14" fill="transparent"
                strokeDasharray="19 238.7" strokeDashoffset="-202.8" />
              {/* Water Sports 7% */}
              <circle cx="50" cy="50" r="38" stroke="#06b6d4" strokeWidth="14" fill="transparent"
                strokeDasharray="16.7 238.7" strokeDashoffset="-221.8" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black text-slate-900">1,482</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bookings</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>Bus</span>
              <span className="font-bold text-slate-700">38%</span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Hotels</span>
              <span className="font-bold text-slate-700">22%</span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>Cabs</span>
              <span className="font-bold text-slate-700">15%</span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>Flights</span>
              <span className="font-bold text-slate-700">10%</span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>Trains</span>
              <span className="font-bold text-slate-700">8%</span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>Water Sports</span>
              <span className="font-bold text-slate-700">7%</span>
            </div>
          </div>
        </div>

        {/* Recent Bookings Feed (Right column) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Bookings</h2>
            <Link href="/bookings" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {[
              {
                service: 'Bus - Ahmedabad to Diu',
                code: '#NKL126783',
                amount: '₹850',
                status: 'Confirmed',
                time: '2 min ago',
                icon: Bus,
                color: 'bg-blue-50 text-blue-600',
              },
              {
                service: 'Hotel - Praveg Beach Resort',
                code: '#NKL126782',
                amount: '₹7,500',
                status: 'Confirmed',
                time: '8 min ago',
                icon: Building2,
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                service: 'Cab - Diu Airport Transfer',
                code: '#NKL126781',
                amount: '₹1,200',
                status: 'Confirmed',
                time: '15 min ago',
                icon: Car,
                color: 'bg-orange-50 text-orange-600',
              },
              {
                service: 'Water Sports - Jet Ski',
                code: '#NKL126780',
                amount: '₹500',
                status: 'Confirmed',
                time: '28 min ago',
                icon: Waves,
                color: 'bg-cyan-50 text-cyan-600',
              },
              {
                service: 'Flight - Delhi to Mumbai',
                code: '#NKL126779',
                amount: '₹4,820',
                status: 'Pending',
                time: '32 min ago',
                icon: ShoppingBag,
                color: 'bg-amber-50 text-amber-600',
              },
            ].map(item => (
              <div key={item.code} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", item.color)}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">{item.service}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{item.code}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-extrabold text-slate-900">{item.amount}</div>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      item.status === 'Confirmed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Secondary Row: Revenue Summary (Bar chart), Top Destinations, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Revenue Summary (Bar Chart by Vertical) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue Summary</span>
              <div className="text-2xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                ₹12,46,230
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> 24% <span className="font-normal text-slate-400 ml-1">vs last 30 days</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span>This Month</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {[
              { name: 'Bus', val: '₹4.8L', height: '85%', color: 'bg-blue-600' },
              { name: 'Hotels', val: '₹3.1L', height: '60%', color: 'bg-emerald-500' },
              { name: 'Cabs', val: '₹1.9L', height: '42%', color: 'bg-orange-400' },
              { name: 'Flights', val: '₹1.2L', height: '28%', color: 'bg-purple-500' },
              { name: 'Trains', val: '₹0.8L', height: '18%', color: 'bg-rose-500' },
              { name: 'Water Sports', val: '₹0.6L', height: '14%', color: 'bg-cyan-400' },
            ].map(col => (
              <div key={col.name} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-600 mb-1.5 opacity-90 group-hover:scale-105 transition-transform">
                  {col.val}
                </span>
                <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-full">
                  <div 
                    className={cn("w-full rounded-t-lg transition-all duration-500 group-hover:opacity-90", col.color)} 
                    style={{ height: col.height }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-2 truncate w-full text-center">
                  {col.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Destinations */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Top Destinations</h2>
            <Link href="/reports" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          <div className="space-y-3.5">
            {[
              { rank: 1, name: 'Diu', bookings: '482 bookings', percent: '32%', width: 'w-[32%]' },
              { rank: 2, name: 'Somnath', bookings: '286 bookings', percent: '19%', width: 'w-[19%]' },
              { rank: 3, name: 'Dwarka', bookings: '210 bookings', percent: '14%', width: 'w-[14%]' },
              { rank: 4, name: 'Ahmedabad', bookings: '178 bookings', percent: '12%', width: 'w-[12%]' },
              { rank: 5, name: 'Rajkot', bookings: '142 bookings', percent: '10%', width: 'w-[10%]' },
            ].map(dest => (
              <div key={dest.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-400 w-3">{dest.rank}</span>
                  <div>
                    <div className="font-bold text-slate-800">{dest.name}</div>
                    <div className="text-[11px] text-slate-400">{dest.bookings}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-32">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full bg-blue-600 rounded-full", dest.width)} />
                  </div>
                  <span className="font-bold text-slate-600 w-8 text-right">{dest.percent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions (8 grid buttons from Reference 1) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h2>

          <div className="grid grid-cols-4 gap-3 text-center">
            <Link href="/schedules" className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Bus className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 mt-2">Add Bus Route</span>
            </Link>

            <Link href="/inventory/hotels" className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 mt-2">Add Hotel</span>
            </Link>

            <Link href="/bookings/cab" className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 mt-2">Add Cab</span>
            </Link>

            <Link href="/vendors" className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 mt-2">Add Vendor</span>
            </Link>

            <Link href="/sales" className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Tag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 mt-2">Create Offer</span>
            </Link>

            <Link href="/payouts" className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 mt-2">Manage Wallet</span>
            </Link>

            <Link href="/system" className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 mt-2 leading-tight">Send Notification</span>
            </Link>

            <Link href="/reports" className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 mt-2">View Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Bottom Triplet: Recent Users, Top Vendors, System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Users */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Users</h2>
            <Link href="/users" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email / Phone</th>
                  <th className="pb-2">Registered On</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { name: 'Rahul Mehta', contact: '+91 98765 43210', date: '14 Oct 2026', status: 'Active' },
                  { name: 'Priya Shah', contact: '+91 98765 43211', date: '14 Oct 2026', status: 'Active' },
                  { name: 'Amit Kumar', contact: '+91 98765 43212', date: '13 Oct 2026', status: 'Active' },
                  { name: 'Neha Patel', contact: '+91 98765 43213', date: '13 Oct 2026', status: 'Active' },
                ].map(u => (
                  <tr key={u.contact} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-bold text-slate-800">{u.name}</td>
                    <td className="py-2.5 text-slate-500">{u.contact}</td>
                    <td className="py-2.5 text-slate-400">{u.date}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Vendors */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Top Vendors</h2>
            <Link href="/vendors" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                  <th className="pb-2">Vendor Name</th>
                  <th className="pb-2">Service</th>
                  <th className="pb-2">Bookings</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { name: 'Shree Travels', service: 'Bus', bookings: '420', status: 'Active' },
                  { name: 'Praveg Beach Resort', service: 'Hotel', bookings: '312', status: 'Active' },
                  { name: 'Diu Cabs', service: 'Cab', bookings: '286', status: 'Active' },
                  { name: 'Sea Adventure', service: 'Water Sports', bookings: '210', status: 'Active' },
                  { name: 'Indigo', service: 'Flights', bookings: '178', status: 'Active' },
                ].map(v => (
                  <tr key={v.name} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-bold text-slate-800">{v.name}</td>
                    <td className="py-2.5 text-slate-500">{v.service}</td>
                    <td className="py-2.5 font-semibold text-slate-700">{v.bookings}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">System Status</h2>
            <Link href="/system" className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              All Systems Operational
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Website & Web App', status: 'Operational' },
              { name: 'Payment Gateway (Razorpay)', status: 'Operational' },
              { name: 'Bus API (SRDV Platform)', status: 'Operational' },
              { name: 'Flight Aggregator API', status: 'Operational' },
              { name: 'Hotel Engine API', status: 'Operational' },
              { name: 'SMS & Email Notification Service', status: 'Operational' },
            ].map(sys => (
              <div key={sys.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-none">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-medium text-slate-700">{sys.name}</span>
                </div>
                <span className="text-slate-400 font-semibold">{sys.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
