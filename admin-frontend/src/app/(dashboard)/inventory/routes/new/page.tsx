/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, Plus, Trash2, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sourceCity, setSourceCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [distanceKm, setDistanceKm] = useState(350);
  const [durationHours, setDurationHours] = useState(6);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const [boardingPoints, setBoardingPoints] = useState([
    { name: '', address: '', landmark: '', contact_phone: '', latitude: 0, longitude: 0, order_index: 1 },
  ]);

  const [droppingPoints, setDroppingPoints] = useState([
    { name: '', address: '', landmark: '', contact_phone: '', latitude: 0, longitude: 0, order_index: 1 },
  ]);

  const addBoarding = () => {
    setBoardingPoints([
      ...boardingPoints,
      { name: '', address: '', landmark: '', contact_phone: '', latitude: 0, longitude: 0, order_index: boardingPoints.length + 1 },
    ]);
  };

  const removeBoarding = (index: number) => {
    setBoardingPoints(boardingPoints.filter((_, i) => i !== index));
  };

  const addDropping = () => {
    setDroppingPoints([
      ...droppingPoints,
      { name: '', address: '', landmark: '', contact_phone: '', latitude: 0, longitude: 0, order_index: droppingPoints.length + 1 },
    ]);
  };

  const removeDropping = (index: number) => {
    setDroppingPoints(droppingPoints.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCity.trim() || !destinationCity.trim()) {
      toast.error('Source and Destination cities are required');
      return;
    }

    const totalMinutes = Number(durationHours) * 60 + Number(durationMinutes);
    if (totalMinutes <= 0) {
      toast.error('Please specify valid trip duration');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/bus/routes', {
        source_city: sourceCity.trim(),
        destination_city: destinationCity.trim(),
        distance_km: Number(distanceKm),
        estimated_duration_minutes: totalMinutes,
        boarding_points: boardingPoints.filter((p) => p.name.trim()),
        dropping_points: droppingPoints.filter((p) => p.name.trim()),
      });

      toast.success('Highway route corridor created successfully!');
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
              Specify origin, destination, distance, human-friendly hours/minutes, and passenger terminals.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Origin / Source City (Autocomplete) *</label>
            <LocationAutocomplete
              required
              value={sourceCity}
              onChange={setSourceCity}
              placeholder="Type to search origin city (e.g. Ahmedabad, Kolkata)..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Destination City (Autocomplete) *</label>
            <LocationAutocomplete
              required
              value={destinationCity}
              onChange={setDestinationCity}
              placeholder="Type to search destination (e.g. Diu, Siliguri)..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Highway Distance (KM) *</label>
            <Input
              type="number"
              min="1"
              required
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-semibold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Estimated Duration (Hours & Minutes) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="72"
                  required
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-semibold pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">hrs</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50 text-xs font-semibold pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">mins</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Total Transit Time: {durationHours}h {durationMinutes}m ({Number(durationHours) * 60 + Number(durationMinutes)} mins)
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
              <p className="text-[11px] text-slate-400">Terminal stops where passengers board in {sourceCity || 'origin'}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addBoarding} className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Stop
            </Button>
          </div>

          {boardingPoints.map((point, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 items-center">
              <Input
                placeholder="Station / Stand Name"
                value={point.name}
                onChange={(e) => {
                  const updated = [...boardingPoints];
                  updated[index].name = e.target.value;
                  setBoardingPoints(updated);
                }}
                className="h-9 bg-white text-xs"
              />
              <Input
                placeholder="Landmark"
                value={point.landmark}
                onChange={(e) => {
                  const updated = [...boardingPoints];
                  updated[index].landmark = e.target.value;
                  setBoardingPoints(updated);
                }}
                className="h-9 bg-white text-xs"
              />
              <Input
                placeholder="Street Address"
                value={point.address}
                onChange={(e) => {
                  const updated = [...boardingPoints];
                  updated[index].address = e.target.value;
                  setBoardingPoints(updated);
                }}
                className="h-9 bg-white text-xs"
              />
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Contact Phone"
                  value={point.contact_phone}
                  onChange={(e) => {
                    const updated = [...boardingPoints];
                    updated[index].contact_phone = e.target.value;
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
              <p className="text-[11px] text-slate-400">Stops where passengers get dropped off in {destinationCity || 'destination'}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addDropping} className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Stop
            </Button>
          </div>

          {droppingPoints.map((point, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 items-center">
              <Input
                placeholder="Drop Point Name"
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
              <Input
                placeholder="Street Address"
                value={point.address}
                onChange={(e) => {
                  const updated = [...droppingPoints];
                  updated[index].address = e.target.value;
                  setDroppingPoints(updated);
                }}
                className="h-9 bg-white text-xs"
              />
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Contact Phone"
                  value={point.contact_phone}
                  onChange={(e) => {
                    const updated = [...droppingPoints];
                    updated[index].contact_phone = e.target.value;
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
