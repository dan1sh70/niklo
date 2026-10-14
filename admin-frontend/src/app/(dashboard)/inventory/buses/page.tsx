/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Bus, Plus, Search, Edit3, Trash2, ShieldCheck, Armchair, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BusesInventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: buses, isLoading } = useQuery({
    queryKey: ['admin-buses-inventory'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/buses');
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [
          {
            id: '11111111-1111-1111-1111-111111111112',
            registration_number: 'KA-01-F-1234',
            bus_type: 'AC_SLEEPER',
            total_seats: 36,
            operator_id: '11111111-1111-1111-1111-111111111111',
            operator: { name: 'National Travels' },
            is_active: true,
            amenities: { wifi: true, charging: true, blanket: true },
          },
          {
            id: '11111111-1111-1111-1111-111111111114',
            registration_number: 'GJ-01-AB-9876',
            bus_type: 'AC_SEATER',
            total_seats: 45,
            operator_id: '11111111-1111-1111-1111-111111111111',
            operator: { name: 'Shree Travels Diu' },
            is_active: true,
            amenities: { wifi: true, water_bottle: true },
          },
        ];
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch(`/bus/buses/${id}`, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-buses-inventory'] });
      toast.success('Bus status deactivated successfully');
    },
    onError: () => {
      toast.error('Failed to update bus status');
    },
  });

  const filteredBuses = (buses || []).filter((b: any) =>
    (b.registration_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.bus_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.operator?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fleet & Buses Management</h1>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
              {filteredBuses.length} Buses
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure bus fleet, seat configurations (2+1 / 2+2 layout), sleeper decks, and active registrations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inventory/buses/new">
            <Button className="bg-[#0066FF] hover:bg-blue-600 text-white gap-2 font-medium shadow-sm">
              <Plus className="w-4 h-4" /> Add New Bus
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by registration number, type, or operator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white text-sm rounded-xl"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBuses.map((bus: any) => (
            <div
              key={bus.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                      <Bus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm tracking-wide">
                        {bus.registration_number}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {bus.operator?.name || 'Operator ID: ' + (bus.operator_id?.slice(0, 8) || 'N/A')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      bus.is_active
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {bus.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bus Type:</span>
                    <span className="font-semibold text-slate-800">{bus.bus_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Capacity:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Armchair className="w-3.5 h-3.5 text-blue-500" /> {bus.total_seats} Seats
                    </span>
                  </div>
                  {bus.amenities && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">Amenities:</span>
                      {Object.keys(bus.amenities).map((key) => (
                        <span key={key} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {key}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <Link href={`/inventory/buses/seats?id=${bus.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5">
                    <Armchair className="w-3.5 h-3.5" /> Seat Layout
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Link href={`/inventory/buses/edit?id=${bus.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Deactivate this bus?')) {
                        deleteMutation.mutate(bus.id);
                      }
                    }}
                    className="h-8 w-8 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredBuses.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
              No buses found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
