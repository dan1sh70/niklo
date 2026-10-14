/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Bus, ArrowLeft, Save, Calendar, Clock, MapPin, IndianRupee, Layers, Route as RouteIcon, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateBusSchedulePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Load interconnected Operators
  const { data: operators, isLoading: opLoading } = useQuery({
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

  // Load interconnected Routes
  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['admin-bus-routes'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/routes');
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
  });

  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedBusId, setSelectedBusId] = useState('');

  // Load Buses belonging to selected operator
  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ['admin-operator-buses', selectedOperatorId],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/buses', {
          params: selectedOperatorId ? { operator_id: selectedOperatorId } : undefined,
        });
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    enabled: true,
  });

  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [departureTime, setDepartureTime] = useState('22:00');
  const [arrivalTime, setArrivalTime] = useState('06:00');
  const [baseFare, setBaseFare] = useState(750);

  const selectedBus = (buses || []).find((b: any) => b.id === (selectedBusId || buses?.[0]?.id));
  const availableSeats = selectedBus?.total_seats || 36;

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/bus/schedules', payload);
    },
    onSuccess: () => {
      toast.success('Bus trip schedule published successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-bus-schedules'] });
      router.push('/schedules');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create bus schedule');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const opId = selectedOperatorId || operators?.[0]?.id;
    const rId = selectedRouteId || routes?.[0]?.id;
    const bId = selectedBusId || buses?.[0]?.id;

    if (!opId || !rId || !bId) {
      toast.error('Please ensure Operator, Route Corridor, and Bus Coach are all selected.');
      return;
    }

    createMutation.mutate({
      operator_id: opId,
      route_id: rId,
      bus_id: bId,
      departure_date: departureDate,
      departure_time: departureTime,
      arrival_time: arrivalTime,
      base_fare: Number(baseFare),
      available_seats: Number(availableSeats),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/schedules">
          <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Schedules
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Publish Interconnected Bus Schedule</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Link an active Fleet Operator, Highway Route Corridor, and Registered Bus Coach.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Linked Entities */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Interconnected Supply Chain Selection
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" /> Fleet Operator *
                </label>
                <select
                  required
                  value={selectedOperatorId || operators?.[0]?.id || ''}
                  onChange={(e) => {
                    setSelectedOperatorId(e.target.value);
                    setSelectedBusId(''); // Reset bus selection for new operator
                  }}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {opLoading && <option>Loading operators...</option>}
                  {(operators || []).map((op: any) => (
                    <option key={op.id} value={op.id}>
                      {op.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <RouteIcon className="w-3.5 h-3.5 text-blue-500" /> Highway Route *
                </label>
                <select
                  required
                  value={selectedRouteId || routes?.[0]?.id || ''}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {routesLoading && <option>Loading routes...</option>}
                  {(routes || []).map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.source_city} ➔ {r.destination_city} ({r.distance_km || 0} km)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-blue-500" /> Assigned Coach *
                </label>
                <select
                  required
                  value={selectedBusId || buses?.[0]?.id || ''}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {busesLoading && <option>Loading buses...</option>}
                  {(buses || []).length === 0 && <option>No buses registered for this operator</option>}
                  {(buses || []).map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.registration_number} • {b.bus_type} ({b.total_seats} seats)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Departure Timings & Fares */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Timetable & Passenger Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Departure Date *
                </label>
                <Input
                  type="date"
                  required
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Departure Time *
                </label>
                <Input
                  type="time"
                  required
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Arrival Time *
                </label>
                <Input
                  type="time"
                  required
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Base Ticket Fare (₹) *
                </label>
                <Input
                  type="number"
                  min="50"
                  required
                  value={baseFare}
                  onChange={(e) => setBaseFare(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Connected summary card */}
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-blue-900 block">Supply Interconnection Summary:</span>
              <span className="text-blue-700">
                Seat layout from <span className="font-semibold">{selectedBus?.registration_number || 'selected bus'}</span> ({availableSeats} berths) will be automatically mapped to this trip schedule.
              </span>
            </div>
            <Link href="/inventory/buses" className="text-blue-600 underline font-semibold shrink-0">
              Manage Fleet Layouts
            </Link>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/schedules">
              <Button type="button" variant="outline" className="h-11 rounded-xl px-5 text-sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-11 rounded-xl px-6 bg-[#0066FF] hover:bg-blue-600 text-white font-bold gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {createMutation.isPending ? 'Publishing Schedule...' : 'Publish Trip Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
