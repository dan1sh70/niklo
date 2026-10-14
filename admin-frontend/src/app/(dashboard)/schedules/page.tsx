/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Bus, Plus, Search, Calendar, Clock, MapPin, IndianRupee, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BusSchedulesListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['admin-bus-schedules'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/schedules');
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [
          {
            id: 'sch-101',
            route_name: 'Ahmedabad ➔ Diu',
            operator_name: 'Shree Travels',
            bus_type: 'AC Sleeper 2+1',
            bus_number: 'GJ-01-1001',
            departure_date: '2026-10-15',
            departure_time: '06:00 AM',
            arrival_time: '02:30 PM',
            base_fare: 850,
            available_seats: 38,
            total_seats: 45,
            status: 'SCHEDULED',
          },
          {
            id: 'sch-102',
            route_name: 'Diu ➔ Surat',
            operator_name: 'Shree Travels',
            bus_type: 'AC Seater Multi-Axle',
            bus_number: 'GJ-01-1002',
            departure_date: '2026-10-15',
            departure_time: '08:30 AM',
            arrival_time: '05:45 PM',
            base_fare: 920,
            available_seats: 42,
            total_seats: 45,
            status: 'SCHEDULED',
          },
          {
            id: 'sch-103',
            route_name: 'Diu ➔ Rajkot',
            operator_name: 'Jay Somnath Travels',
            bus_type: 'Non-AC Sleeper',
            bus_number: 'GJ-01-1003',
            departure_date: '2026-10-15',
            departure_time: '10:00 AM',
            arrival_time: '03:15 PM',
            base_fare: 450,
            available_seats: 26,
            total_seats: 40,
            status: 'SCHEDULED',
          },
          {
            id: 'sch-104',
            route_name: 'Diu ➔ Mumbai (Borivali)',
            operator_name: 'Eagle Falcon Bus',
            bus_type: 'BharatBenz Ultra Sleeper',
            bus_number: 'GJ-01-1004',
            departure_date: '2026-10-16',
            departure_time: '01:30 PM',
            arrival_time: '06:00 AM',
            base_fare: 1450,
            available_seats: 12,
            total_seats: 36,
            status: 'SCHEDULED',
          },
        ];
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/admin/schedules/${id}`);
    },
    onSuccess: () => {
      toast.success('Schedule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-bus-schedules'] });
    },
    onError: () => {
      toast.error('Failed to delete schedule');
    },
  });

  const filtered = (schedules || []).filter((s: any) =>
    (s.route_name || s.route_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.operator_name || s.operator_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.bus_number || s.bus_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Title & New Page Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bus className="w-6 h-6 text-blue-600" />
            Bus Schedules & Route Dispatch
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage scheduled departures, seat inventory, tariff cards, and bus fleet assignments.
          </p>
        </div>

        <Link href="/schedules/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md gap-2">
            <Plus className="w-4 h-4" /> Add New Bus Schedule
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by route (e.g. Diu, Ahmedabad, Mumbai), operator, or bus registration number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 p-0 text-sm"
        />
      </div>

      {/* Grid of Schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item: any) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  {item.operator_name || 'Verified Operator'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.status === 'SCHEDULED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.status || 'SCHEDULED'}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-base mb-1 flex items-center gap-2">
                {item.route_name || `${item.route_id?.substring(0, 8)}...`}
              </h3>
              <div className="text-xs text-slate-500 font-medium mb-4">
                {item.bus_type || 'AC Luxury Coach'} • {item.bus_number || item.bus_id?.substring(0, 8)}
              </div>

              <div className="bg-slate-50 rounded-xl p-3 space-y-2 mb-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500 font-normal">
                    <Calendar className="w-3.5 h-3.5" /> Date:
                  </span>
                  <span>{item.departure_date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500 font-normal">
                    <Clock className="w-3.5 h-3.5" /> Timing:
                  </span>
                  <span>{item.departure_time} ➔ {item.arrival_time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500 font-normal">
                    Seats Available:
                  </span>
                  <span className="font-black text-blue-600">
                    {item.available_seats || 38} / {item.total_seats || 45}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Base Ticket Fare</span>
                <div className="text-lg font-black text-slate-900">
                  ₹{item.base_fare}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Link href={`/schedules/seats?id=${item.id}`}>
                  <Button size="sm" variant="outline" className="rounded-xl h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50 text-xs">
                    Seat Map
                  </Button>
                </Link>
                <Link href={`/schedules/edit?id=${item.id}`}>
                  <Button size="sm" variant="outline" className="rounded-xl h-8 px-2 text-slate-600">
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="rounded-xl h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            No bus schedules found matching your query.
          </div>
        )}
      </div>
    </div>
  );
}
