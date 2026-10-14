/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Bus, ArrowLeft, Save, Calendar, Clock, MapPin, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateBusSchedulePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    route_name: 'Ahmedabad ➔ Diu',
    operator_name: 'Shree Travels',
    bus_type: 'AC Sleeper (2+1)',
    bus_number: 'GJ-01-1005',
    departure_date: new Date().toISOString().split('T')[0],
    departure_time: '07:00 AM',
    arrival_time: '03:30 PM',
    base_fare: 850,
    available_seats: 45,
    total_seats: 45,
    boarding_points: 'Geeta Mandir, Iscon Cross Road, Paldi',
    dropping_points: 'Jethibai Bus Stand, Diu Port, Nagoa Beach',
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admin/schedules', payload);
    },
    onSuccess: () => {
      toast.success('Bus schedule published successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-bus-schedules'] });
      router.push('/schedules');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create bus schedule');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/schedules">
          <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Schedules
          </Button>
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Create New Bus Departure Schedule</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Publish departure timings, seat manifests, and tariff controls to Niklo Bus booking platform.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Route & Fleet */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Route & Fleet Assignment</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Route Corridor Name</label>
                <Input
                  required
                  placeholder="e.g. Ahmedabad ➔ Diu"
                  value={formData.route_name}
                  onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Bus Fleet Operator</label>
                <Input
                  required
                  placeholder="e.g. Shree Travels"
                  value={formData.operator_name}
                  onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Coach Type</label>
                <Input
                  required
                  placeholder="e.g. BharatBenz AC Sleeper (2+1)"
                  value={formData.bus_type}
                  onChange={(e) => setFormData({ ...formData, bus_type: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Vehicle Registration Number</label>
                <Input
                  required
                  placeholder="e.g. GJ-01-AB-1234"
                  value={formData.bus_number}
                  onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                  className="rounded-xl font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Timings & Departure */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Schedule Timings & Capacity</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Departure Date</label>
                <Input
                  required
                  type="date"
                  value={formData.departure_date}
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Departure Time</label>
                <Input
                  required
                  placeholder="06:00 AM"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Arrival Time</label>
                <Input
                  required
                  placeholder="02:30 PM"
                  value={formData.arrival_time}
                  onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Total Seat Capacity</label>
                <Input
                  required
                  type="number"
                  value={formData.total_seats}
                  onChange={(e) => setFormData({ ...formData, total_seats: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Base Ticket Price (₹)</label>
                <Input
                  required
                  type="number"
                  value={formData.base_fare}
                  onChange={(e) => setFormData({ ...formData, base_fare: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Boarding & Dropping Points */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Boarding & Dropping Points</h2>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Boarding Points (Comma Separated)</label>
              <Input
                placeholder="Geeta Mandir (06:00 AM), Iscon Cross Road (06:30 AM), Sanand (07:00 AM)"
                value={formData.boarding_points}
                onChange={(e) => setFormData({ ...formData, boarding_points: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Dropping Points (Comma Separated)</label>
              <Input
                placeholder="Jethibai Bus Stand (02:00 PM), Diu Fort (02:30 PM), Nagoa Beach (03:00 PM)"
                value={formData.dropping_points}
                onChange={(e) => setFormData({ ...formData, dropping_points: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/schedules">
              <Button type="button" variant="outline" className="rounded-xl px-5">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 gap-2 shadow-md shadow-blue-500/20"
            >
              <Save className="w-4 h-4" />
              {createMutation.isPending ? 'Publishing Schedule...' : 'Save & Publish Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
