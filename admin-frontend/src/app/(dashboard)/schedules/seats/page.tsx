/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Armchair, Lock, CheckCircle2, ShieldCheck, MapPin, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

function ScheduleSeatMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get('id');

  const [fetching, setFetching] = useState(true);
  const [schedule, setSchedule] = useState<any>(null);
  const [seatMap, setSeatMap] = useState<any[]>([]);
  const [boardingPoints, setBoardingPoints] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!scheduleId) {
      toast.error('Schedule ID missing');
      router.push('/schedules');
      return;
    }

    async function loadData() {
      try {
        const [schRes, mapRes, boardRes] = await Promise.all([
          apiClient.get(`/bus/schedules/${scheduleId}`),
          apiClient.get(`/bus/schedules/${scheduleId}/seat-map`).catch(() => ({ data: null })),
          apiClient.get(`/bus/schedules/${scheduleId}/boarding-points`).catch(() => ({ data: null })),
        ]);

        const sch = schRes.data?.data || schRes.data;
        setSchedule(sch);

        const sm = mapRes.data?.data || mapRes.data;
        if (Array.isArray(sm)) {
          setSeatMap(sm);
        } else if (sm?.seats && Array.isArray(sm.seats)) {
          setSeatMap(sm.seats);
        }

        const bp = boardRes.data?.data || boardRes.data;
        if (Array.isArray(bp)) {
          setBoardingPoints(bp);
        }
      } catch {
        toast.error('Failed to load schedule live seat map');
      } finally {
        setFetching(false);
      }
    }

    loadData();
  }, [scheduleId, router]);

  const handleLockSeat = async (seatNumber: string) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/bus/schedules/${scheduleId}/lock-seat`, {
        seat_numbers: [seatNumber],
        user_id: 'admin-manual-override',
      });
      toast.success(`Seat ${seatNumber} locked temporarily for manual booking`);
      // refresh map
      const mapRes = await apiClient.get(`/bus/schedules/${scheduleId}/seat-map`);
      const sm = mapRes.data?.data || mapRes.data;
      if (Array.isArray(sm)) setSeatMap(sm);
      else if (sm?.seats) setSeatMap(sm.seats);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to lock seat');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSeat = async (seatNumber: string) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/bus/schedules/${scheduleId}/confirm-seats`, {
        seat_numbers: [seatNumber],
      });
      toast.success(`Seat ${seatNumber} confirmed as Booked`);
      // refresh map
      const mapRes = await apiClient.get(`/bus/schedules/${scheduleId}/seat-map`);
      const sm = mapRes.data?.data || mapRes.data;
      if (Array.isArray(sm)) setSeatMap(sm);
      else if (sm?.seats) setSeatMap(sm.seats);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm seat');
    } finally {
      setActionLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-2xl border border-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/schedules">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Live Seat Map & Manifest: {schedule?.route?.source_city || 'Origin'} ➔ {schedule?.route?.destination_city || 'Destination'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Departure: <span className="font-semibold text-slate-700">{schedule?.departure_date} at {schedule?.departure_time}</span> • Base Fare: <span className="font-semibold text-emerald-600">₹{schedule?.base_fare}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seat Map Visual Deck */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Interactive Coach Seat Grid</h3>
              <p className="text-xs text-slate-500">Select any berth to view booking state or trigger administrative overrides.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> Locked</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-400 inline-block"></span> Booked</span>
            </div>
          </div>

          {seatMap.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Armchair className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              Seat layout is being loaded or defaulted for this departure.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 max-h-[500px] overflow-y-auto">
              {seatMap.map((seat: any) => {
                const isBooked = seat.is_booked || seat.status === 'BOOKED';
                const isLocked = seat.is_locked || seat.status === 'LOCKED';
                const isSelected = selectedSeat === (seat.seat_number || seat.seat_id);

                return (
                  <button
                    key={seat.seat_number || seat.id}
                    type="button"
                    onClick={() => setSelectedSeat(seat.seat_number || seat.seat_id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/30'
                        : isBooked
                        ? 'border-slate-200 bg-slate-200/70 text-slate-500'
                        : isLocked
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:border-emerald-400'
                    }`}
                  >
                    <Armchair className={`w-4 h-4 mb-1 ${
                      isBooked ? 'text-slate-400' : isLocked ? 'text-amber-500' : 'text-emerald-600'
                    }`} />
                    <span className="text-xs font-bold">{seat.seat_number}</span>
                    <span className="text-[9px] font-semibold uppercase mt-0.5">
                      {isBooked ? 'Booked' : isLocked ? 'Locked' : 'Open'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Seat Action & Boarding info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Seat Management Override</h3>
            {selectedSeat ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Selected Seat Number</span>
                  <span className="text-base font-bold text-slate-900">{selectedSeat}</span>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleLockSeat(selectedSeat)}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full text-xs h-9 text-amber-700 border-amber-300 hover:bg-amber-50 gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" /> Lock Seat Temporarily
                  </Button>
                  <Button
                    onClick={() => handleConfirmSeat(selectedSeat)}
                    disabled={actionLoading}
                    className="w-full text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm As Booked
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Click any seat in the coach grid to trigger admin actions.</p>
            )}
          </div>

          {/* Boarding Points on this Schedule */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Boarding Points Manifest
            </h3>
            {boardingPoints.length === 0 ? (
              <p className="text-xs text-slate-400">No custom boarding points returned for this trip.</p>
            ) : (
              <div className="space-y-2">
                {boardingPoints.map((bp: any, i: number) => (
                  <div key={i} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-800">{bp.name}</span>
                    {bp.landmark && <span className="text-slate-500 block text-[11px]">{bp.landmark}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleSeatMapPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading seat map...</div>}>
      <ScheduleSeatMapContent />
    </Suspense>
  );
}
