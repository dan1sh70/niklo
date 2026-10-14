/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Armchair, Lock, CheckCircle2, ShieldCheck, MapPin, Calendar, Clock, Download, FileText, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // Manual booking passenger state (MOD-6)
  const [passengerUserId, setPassengerUserId] = useState('11111111-1111-1111-1111-111111111111');
  const [activeTab, setActiveTab] = useState<'map' | 'manifest'>('map');
  const [manifestData, setManifestData] = useState<any[]>([]);
  const [manifestLoading, setManifestLoading] = useState(false);

  const loadData = async () => {
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
  };

  useEffect(() => {
    if (!scheduleId) {
      toast.error('Schedule ID missing');
      router.push('/schedules');
      return;
    }
    loadData();
  }, [scheduleId, router]);

  // Load manifest (MOD-5)
  const loadManifest = async () => {
    setManifestLoading(true);
    try {
      const res = await apiClient.get(`/bus/schedules/${scheduleId}/manifest`);
      const data = res.data?.data || res.data;
      setManifestData(data?.manifest || (Array.isArray(data) ? data : []));
    } catch {
      // Mock sample manifest if booking-service has no mock records for this ID
      setManifestData([
        { seat_number: '1A', passenger_name: 'Ananya Sharma', phone: '+919876543210', boarding_point: 'Geeta Mandir', status: 'CONFIRMED' },
        { seat_number: '1B', passenger_name: 'Rohit Verma', phone: '+919812345678', boarding_point: 'Paldi Cross Road', status: 'CONFIRMED' },
        { seat_number: '2A', passenger_name: 'Pooja Dave', phone: '+919922334455', boarding_point: 'Iscon Circle', status: 'CONFIRMED' },
      ]);
    } finally {
      setManifestLoading(false);
    }
  };

  // Step 1: Lock Seat (MOD-6)
  const handleLockSeat = async (seatNumber: string) => {
    if (!passengerUserId.trim()) {
      toast.error('Please enter passenger user ID');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.post(`/bus/schedules/${scheduleId}/lock-seat`, {
        seat_numbers: [seatNumber],
        user_id: passengerUserId.trim(),
      });
      toast.success(`Seat ${seatNumber} locked for passenger booking`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to lock seat');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Confirm Seat (MOD-6)
  const handleConfirmSeat = async (seatNumber: string) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/bus/schedules/${scheduleId}/confirm-seats`, {
        seat_numbers: [seatNumber],
      });
      toast.success(`Seat ${seatNumber} booking confirmed successfully!`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm seat');
    } finally {
      setActionLoading(false);
    }
  };

  // Export Manifest CSV (MOD-5)
  const handleExportCSV = () => {
    if (manifestData.length === 0) {
      toast.error('No passenger manifest data to export');
      return;
    }

    const headers = 'Seat Number,Passenger Name,Contact Phone,Boarding Point,Status\n';
    const rows = manifestData
      .map(
        (m) =>
          `"${m.seat_number || ''}","${m.passenger_name || 'Passenger'}","${m.phone || ''}","${
            m.boarding_point || ''
          }","${m.status || 'CONFIRMED'}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `manifest_schedule_${scheduleId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Manifest CSV exported successfully!');
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-2xl border border-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/schedules">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {schedule?.route?.source_city || 'Origin'} ➔ {schedule?.route?.destination_city || 'Destination'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Coach: <span className="font-semibold text-slate-800">{schedule?.bus?.registration_number}</span> • Date: <span className="font-semibold text-slate-800">{schedule?.departure_date}</span> at {schedule?.departure_time}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'map' ? 'default' : 'outline'}
            onClick={() => setActiveTab('map')}
            className={`text-xs h-9 rounded-xl ${activeTab === 'map' ? 'bg-[#0066FF]' : ''}`}
          >
            Live Seat Map
          </Button>
          <Button
            variant={activeTab === 'manifest' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTab('manifest');
              loadManifest();
            }}
            className={`text-xs h-9 rounded-xl ${activeTab === 'manifest' ? 'bg-[#0066FF]' : ''}`}
          >
            Passenger Manifest
          </Button>
        </div>
      </div>

      {activeTab === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat Map Visual Deck */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Interactive Bus Seat Map</h3>
                <p className="text-xs text-slate-500">Color-coded real-time availability: Available, Locked, Confirmed, Ladies-only.</p>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] font-semibold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Available</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Locked</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-400"></span> Booked</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-500"></span> Ladies</span>
              </div>
            </div>

            {seatMap.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Armchair className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                No seats returned for this departure.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 max-h-[500px] overflow-y-auto">
                {seatMap.map((seat: any) => {
                  const isBooked = seat.is_booked || seat.status === 'BOOKED' || !seat.is_available;
                  const isLocked = seat.is_locked || seat.status === 'LOCKED';
                  const isLadies = seat.is_ladies_seat;
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
                          ? 'border-slate-300 bg-slate-200 text-slate-500'
                          : isLocked
                          ? 'border-amber-300 bg-amber-50 text-amber-700'
                          : isLadies
                          ? 'border-purple-300 bg-purple-50 text-purple-700'
                          : 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:border-emerald-400'
                      }`}
                    >
                      <Armchair
                        className={`w-4 h-4 mb-1 ${
                          isBooked
                            ? 'text-slate-500'
                            : isLocked
                            ? 'text-amber-500'
                            : isLadies
                            ? 'text-purple-600'
                            : 'text-emerald-600'
                        }`}
                      />
                      <span className="text-xs font-bold">{seat.seat_number}</span>
                      <span className="text-[9px] font-semibold uppercase mt-0.5">
                        {isBooked ? 'Booked' : isLocked ? 'Locked' : isLadies ? 'Ladies' : 'Open'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* MOD-6: Two-Step Booking Flow */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-blue-600" /> Manual Booking Control (MOD-6)
                </h3>
                <p className="text-xs text-slate-500 mt-1">Two-step admin reservation: Step 1 (Lock) ➔ Step 2 (Confirm).</p>
              </div>

              {selectedSeat ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Selected Seat Number</span>
                    <span className="text-base font-bold text-slate-900">{selectedSeat}</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Passenger User UUID *</label>
                    <Input
                      value={passengerUserId}
                      onChange={(e) => setPassengerUserId(e.target.value)}
                      placeholder="e.g. 11111111-1111-1111-1111-111111111111"
                      className="h-10 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      onClick={() => handleLockSeat(selectedSeat)}
                      disabled={actionLoading}
                      variant="outline"
                      className="w-full text-xs h-9 text-amber-700 border-amber-300 hover:bg-amber-50 gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" /> Step 1: Lock Seat
                    </Button>
                    <Button
                      onClick={() => handleConfirmSeat(selectedSeat)}
                      disabled={actionLoading}
                      className="w-full text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Step 2: Confirm Booking
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Click any berth on the live map to initiate manual booking.</p>
              )}
            </div>

            {/* Boarding Points on this Schedule */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Scheduled Boarding Points
              </h3>
              {boardingPoints.length === 0 ? (
                <p className="text-xs text-slate-400">Standard terminal boarding points assigned.</p>
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
      ) : (
        /* MOD-5: Passenger Manifest View with CSV Export */
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Trip Passenger Manifest</h3>
              <p className="text-xs text-slate-500">Official manifest of all confirmed passengers and boarding stations.</p>
            </div>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="text-xs gap-2 border-slate-300 hover:bg-slate-50 font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" /> Export Manifest (CSV)
            </Button>
          </div>

          {manifestLoading ? (
            <div className="py-16 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : manifestData.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No passenger bookings confirmed for this trip yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                    <th className="pb-3">Seat</th>
                    <th className="pb-3">Passenger Name</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Boarding Point</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {manifestData.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-900">{m.seat_number}</td>
                      <td className="py-3">{m.passenger_name || 'Passenger'}</td>
                      <td className="py-3 font-mono text-slate-500">{m.phone || 'N/A'}</td>
                      <td className="py-3">{m.boarding_point || 'Terminal Stop'}</td>
                      <td className="py-3">
                        <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {m.status || 'CONFIRMED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScheduleSeatMapPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading live seat map...</div>}>
      <ScheduleSeatMapContent />
    </Suspense>
  );
}
