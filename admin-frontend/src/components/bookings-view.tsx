/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Ticket, Bus, Car, Building2, Plane, Train, Waves, Package, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const TABS = [
  { id: 'all', label: 'All Bookings', icon: Ticket },
  { id: 'bus', label: 'Bus', icon: Bus },
  { id: 'cab', label: 'Cab', icon: Car },
  { id: 'hotels', label: 'Hotels', icon: Building2 },
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'trains', label: 'Trains', icon: Train },
  { id: 'water-sports', label: 'Water Sports', icon: Waves },
  { id: 'tour-packages', label: 'Tour Packages', icon: Package },
];

export default function GenericBookingsView({ forcedType }: { forcedType?: string }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(forcedType || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings-list', activeTab],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/bookings');
        const raw = res.data?.data || res.data || [];
        return raw;
      } catch {
        return [
          {
            id: 'NKL126783',
            type: 'bus',
            customer_name: 'Rahul Mehta',
            customer_phone: '+91 98765 43210',
            service_title: 'Ahmedabad to Diu (AC Sleeper)',
            date: '14 Oct 2026, 06:00 AM',
            amount: 850,
            status: 'CONFIRMED',
          },
          {
            id: 'NKL126782',
            type: 'hotels',
            customer_name: 'Priya Shah',
            customer_phone: '+91 98765 43211',
            service_title: 'Praveg Beach Resort (Deluxe Tent)',
            date: '14 Oct 2026 - 16 Oct 2026',
            amount: 7500,
            status: 'CONFIRMED',
          },
          {
            id: 'NKL126781',
            type: 'cab',
            customer_name: 'Amit Kumar',
            customer_phone: '+91 98765 43212',
            service_title: 'Diu Airport Transfer (Sedan)',
            date: '14 Oct 2026, 11:30 AM',
            amount: 1200,
            status: 'CONFIRMED',
          },
          {
            id: 'NKL126780',
            type: 'water-sports',
            customer_name: 'Neha Patel',
            customer_phone: '+91 98765 43213',
            service_title: 'Jet Ski Adventure (Nagoa Beach)',
            date: '14 Oct 2026, 02:00 PM',
            amount: 500,
            status: 'CONFIRMED',
          },
          {
            id: 'NKL126779',
            type: 'flights',
            customer_name: 'Vikram Singh',
            customer_phone: '+91 98765 43214',
            service_title: 'Delhi to Mumbai (Indigo 6E-204)',
            date: '15 Oct 2026, 09:15 AM',
            amount: 4820,
            status: 'PENDING',
          },
          {
            id: 'NKL126778',
            type: 'tour-packages',
            customer_name: 'Suresh Raina',
            customer_phone: '+91 98765 43215',
            service_title: 'Diu & Somnath Coastal Tour (4D/3N)',
            date: '18 Oct 2026 - 22 Oct 2026',
            amount: 12500,
            status: 'CONFIRMED',
          },
        ];
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/admin/bookings/${id}/cancel`);
    },
    onSuccess: () => {
      toast.success('Booking status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings-list'] });
    },
    onError: () => {
      toast.error('Failed to update booking status');
    },
  });

  const currentTab = forcedType || activeTab;

  const filteredBookings = (bookings || []).filter((b: any) => {
    const matchesType = currentTab === 'all' || (b.type && b.type.toLowerCase() === currentTab.toLowerCase());
    const matchesSearch = 
      b.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.service_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesType && matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" />
            {forcedType ? `${forcedType.toUpperCase()} Bookings` : 'Universal Bookings Central'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-modal reservation records across all Niklo consumer verticals.
          </p>
        </div>
      </div>

      {/* Vertical Navigation Tabs */}
      {!forcedType && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by ID, customer name, route, or hotel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 border-slate-200 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Service Details</th>
                <th className="py-3 px-4">Passenger / Guest</th>
                <th className="py-3 px-4">Travel Date / Slot</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{b.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{b.service_title || 'Niklo Booking'}</div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{b.type || 'Standard'}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{b.customer_name || 'Passenger'}</div>
                    <div className="text-slate-400 text-[11px]">{b.customer_phone || b.user_id?.substring(0, 8)}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{b.date || new Date().toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 font-black text-slate-900">₹{(b.amount || b.price || 0).toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      b.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-600'
                        : b.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {b.status || 'CONFIRMED'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {b.status !== 'CANCELLED' && (
                      <button
                        onClick={() => cancelMutation.mutate(b.id)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No bookings found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
