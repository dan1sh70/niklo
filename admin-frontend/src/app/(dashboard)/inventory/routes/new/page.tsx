/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, Plus, Trash2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    source_city: '',
    destination_city: '',
    distance_km: 350,
    estimated_duration_minutes: 360,
    is_active: true,
  });

  const [boardingPoints, setBoardingPoints] = useState([
    { name: '', landmark: '', address: '', order_index: 1 },
  ]);

  const [droppingPoints, setDroppingPoints] = useState([
    { name: '', landmark: '', address: '', order_index: 1 },
  ]);

  const addBoarding = () => {
    setBoardingPoints([
      ...boardingPoints,
      { name: '', landmark: '', address: '', order_index: boardingPoints.length + 1 },
    ]);
  };

  const removeBoarding = (index: number) => {
    setBoardingPoints(boardingPoints.filter((_, i) => i !== index));
  };

  const addDropping = () => {
    setDroppingPoints([
      ...droppingPoints,
      { name: '', landmark: '', address: '', order_index: droppingPoints.length + 1 },
    ]);
  };

  const removeDropping = (index: number) => {
    setDroppingPoints(droppingPoints.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source_city.trim() || !formData.destination_city.trim()) {
      toast.error('Source and Destination cities are required');
      return;
    }
    setLoading(true);

    try {
      await apiClient.post('/bus/routes', {
        source_city: formData.source_city,
        destination_city: formData.destination_city,
        distance_km: Number(formData.distance_km),
        estimated_duration_minutes: Number(formData.estimated_duration_minutes),
        is_active: formData.is_active,
        boarding_points: boardingPoints.filter((p) => p.name.trim()),
        dropping_points: droppingPoints.filter((p) => p.name.trim()),
      });

      toast.success('Route corridor created successfully!');
      router.push('/inventory/routes');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/inventory/routes">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Highway Route Corridor</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify origin, destination, distance, travel duration, and passenger boarding / dropping points.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Origin / Source City *</label>
            <Input
              required
              placeholder="e.g. Ahmedabad"
              value={formData.source_city}
              onChange={(e) => setFormData({ ...formData, source_city: e.target.value })}
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-semibold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Destination City *</label>
            <Input
              required
              placeholder="e.g. Diu"
              value={formData.destination_city}
              onChange={(e) => setFormData({ ...formData, destination_city: e.target.value })}
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-semibold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Highway Distance (KM) *</label>
            <Input
              type="number"
              required
              value={formData.distance_km}
              onChange={(e) => setFormData({ ...formData, distance_km: Number(e.target.value) })}
              className="h-11 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Estimated Duration (Minutes) *</label>
            <Input
              type="number"
              required
              value={formData.estimated_duration_minutes}
              onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: Number(e.target.value) })}
              className="h-11 rounded-xl bg-slate-50 border-slate-200"
            />
            <p className="text-[11px] text-slate-400">
              Approx {Math.floor(formData.estimated_duration_minutes / 60)}h{' '}
              {formData.estimated_duration_minutes % 60}m transit time.
            </p>
          </div>
        </div>

        {/* Boarding Points */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Passenger Boarding Pickup Points
              </h3>
              <p className="text-[11px] text-slate-400">Terminal stops where passengers board in {formData.source_city || 'origin'}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addBoarding} className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Stop
            </Button>
          </div>

          {boardingPoints.map((point, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 items-center">
              <Input
                placeholder="Station / Stand Name (e.g. Geeta Mandir)"
                value={point.name}
                onChange={(e) => {
                  const updated = [...boardingPoints];
                  updated[index].name = e.target.value;
                  setBoardingPoints(updated);
                }}
                className="h-9 bg-white text-xs"
              />
              <Input
                placeholder="Landmark (e.g. Platform 3)"
                value={point.landmark}
                onChange={(e) => {
                  const updated = [...boardingPoints];
                  updated[index].landmark = e.target.value;
                  setBoardingPoints(updated);
                }}
                className="h-9 bg-white text-xs"
              />
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Street / City Address"
                  value={point.address}
                  onChange={(e) => {
                    const updated = [...boardingPoints];
                    updated[index].address = e.target.value;
                    setBoardingPoints(updated);
                  }}
                  className="h-9 bg-white text-xs flex-1"
                />
                {boardingPoints.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeBoarding(index)} className="h-8 w-8 text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Dropping Points */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Passenger Dropping Destination Points
              </h3>
              <p className="text-[11px] text-slate-400">Stops where passengers get dropped off in {formData.destination_city || 'destination'}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addDropping} className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Stop
            </Button>
          </div>

          {droppingPoints.map((point, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 items-center">
              <Input
                placeholder="Drop Point Name (e.g. Diu Bus Depot)"
                value={point.name}
                onChange={(e) => {
                  const updated = [...droppingPoints];
                  updated[index].name = e.target.value;
                  setDroppingPoints(updated);
                }}
                className="h-9 bg-white text-xs"
              />
              <Input
                placeholder="Landmark"
                value={point.landmark}
                onChange={(e) => {
                  const updated = [...droppingPoints];
                  updated[index].landmark = e.target.value;
                  setDroppingPoints(updated);
                }}
                className="h-9 bg-white text-xs"
              />
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Street Address"
                  value={point.address}
                  onChange={(e) => {
                    const updated = [...droppingPoints];
                    updated[index].address = e.target.value;
                    setDroppingPoints(updated);
                  }}
                  className="h-9 bg-white text-xs flex-1"
                />
                {droppingPoints.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDropping(index)} className="h-8 w-8 text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link href="/inventory/routes">
            <Button type="button" variant="outline" className="h-11 rounded-xl px-5 text-sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 rounded-xl px-6 bg-[#0066FF] hover:bg-blue-600 text-white gap-2 font-medium shadow-sm"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating Corridor...' : 'Save & Register Route'}
          </Button>
        </div>
      </form>
    </div>
  );
}
