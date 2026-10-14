'use client';

import React from 'react';
import { Search, Bell, Calendar, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function Topbar() {
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

  const adminName = profile?.name || 'Yashasavi Parmar';
  const adminRole = profile?.role?.name || 'Admin';

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 z-20">
      {/* Search Input */}
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          type="search" 
          placeholder="Search bookings, users, vendors, routes, hotels..." 
          className="w-full pl-10 pr-4 py-2 h-11 bg-slate-50/70 border-slate-200/80 rounded-xl text-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:bg-white transition-all"
        />
      </div>
      
      {/* Right Controls */}
      <div className="flex items-center gap-6">
        {/* Date Filter Widget */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>01 Oct 2026 - 14 Oct 2026</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Notification Bell */}
        <button 
          type="button"
          className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
            3
          </span>
        </button>

        {/* User Profile Avatar & Name */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-slate-100">
            {adminName.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'YP'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-1">
              {adminName}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xs text-slate-400 font-medium">{adminRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
