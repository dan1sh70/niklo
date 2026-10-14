/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Bus, Plus, Search, Calendar, Clock, MapPin, IndianRupee, Trash2, Edit3, ArrowRight, Armchair, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BusSchedulesListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');

  // Fetch Operators for filtering
  const { data: operators } = useQuery({
    queryKey: ['admin-bus-operators'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/operators');
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
  });

  // Fetch Schedules (connected to Bus, Route, Operator)
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['admin-bus-schedules', selectedOperator],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/schedules', {
          params: selectedOperator ? { operator_id: selectedOperator } : undefined,
        });
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [
          {
            id: 'sch-101',
            route: { source_city: 'Ahmedabad', destination_city: 'Diu' },
            operator: { name: 'Shree Travels' },
            bus: { registration_number: 'GJ-01-AB-1234', bus_type: 'AC_SLEEPER' },
            departure_date: '2026-10-15',
            departure_time: '06:00:00',
            arrival_time: '14:30:00',
            base_fare: 850,
            available_seats: 36,
            status: 'SCHEDULED',
          },
          {
            id: 'sch-102',
            route: { source_city: 'Bangalore', destination_city: 'Chennai' },
            operator: { name: 'National Travels' },
            bus: { registration_number: 'KA-01-F-1234', bus_type: 'VOLVO_AC' },
            departure_date: '2026-10-15',
            departure_time: '22:00:00',
            arrival_time: '04:30:00',
            base_fare: 920,
            available_seats: 42,
            status: 'SCHEDULED',
          },
        ];
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/bus/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bus-schedules'] });
      toast.success('Schedule departure cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel schedule');
    },
  });

  const filtered = (schedules || []).filter((item: any) => {
    const routeText = `${item.route?.source_city || item.route_name || ''} ${item.route?.destination_city || ''}`.toLowerCase();
    const opText = (item.operator?.name || item.operator_name || '').toLowerCase();
    const busText = (item.bus?.registration_number || item.bus_number || '').toLowerCase();
    const s = searchTerm.toLowerCase();

    return routeText.includes(s) || opText.includes(s) || busText.includes(s);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Active Bus Schedules & Departures</h1>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
              {filtered.length} Trips
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time intercity schedules interconnected with Operator agencies, registered bus fleets, and live seat maps.
          </p>
        </div>

        <Link href="/schedules/new">
          <Button className="bg-[#0066FF] hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm gap-2">
            <Plus className="w-4 h-4" /> Publish New Bus Schedule
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by city (e.g. Diu, Ahmedabad, Chennai), operator name, or coach number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="">All Fleet Operators</option>
            {(operators || []).map((op: any) => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Schedules */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item: any) => {
            const sourceCity = item.route?.source_city || item.route_name?.split('➔')[0]?.trim() || 'Origin';
            const destCity = item.route?.destination_city || item.route_name?.split('➔')[1]?.trim() || 'Destination';
            const operatorName = item.operator?.name || item.operator_name || 'Verified Operator';
            const regNum = item.bus?.registration_number || item.bus_number || item.bus_id?.slice(0, 8);
            const busType = item.bus?.bus_type || item.bus_type || 'AC Sleeper';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-500" /> {operatorName}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'SCHEDULED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status || 'SCHEDULED'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base mb-1 flex items-center gap-1.5">
                    <span>{sourceCity}</span>
                    <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{destCity}</span>
                  </h3>
                  <div className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-2">
                    <span className="font-semibold text-slate-700 font-mono">{regNum}</span>
                    <span>•</span>
                    <span>{busType}</span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 mb-4 text-xs font-semibold text-slate-700 border border-slate-100">
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
                      <span>{item.departure_time?.slice(0, 5)} ➔ {item.arrival_time?.slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500 font-normal">
                        <Armchair className="w-3.5 h-3.5 text-blue-500" /> Available Berths:
                      </span>
                      <span className="font-black text-blue-600">
                        {item.available_seats} Seats
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Base Fare</span>
                    <div className="text-lg font-black text-slate-900">
                      ₹{item.base_fare}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link href={`/schedules/seats?id=${item.id}`}>
                      <Button size="sm" variant="outline" className="rounded-xl h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50 text-xs font-semibold gap-1">
                        <Armchair className="w-3.5 h-3.5" /> Live Map
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
                      onClick={() => {
                        if (confirm('Cancel this bus departure schedule?')) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="rounded-xl h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 text-xs">
              No bus schedules found matching your query or selected operator filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
