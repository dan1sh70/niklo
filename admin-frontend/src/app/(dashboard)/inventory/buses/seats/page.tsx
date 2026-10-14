/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, Armchair, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

function BusSeatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const busId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [bus, setBus] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);

  // Generator state for bulk setup
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(4);
  const [hasUpperDeck, setHasUpperDeck] = useState(false);
  const [defaultSeatType, setDefaultSeatType] = useState('SLEEPER');

  useEffect(() => {
    if (!busId) {
      toast.error('Bus ID missing');
      router.push('/inventory/buses');
      return;
    }

    async function loadData() {
      try {
        const [busRes, seatsRes] = await Promise.all([
          apiClient.get(`/bus/buses/${busId}`),
          apiClient.get(`/bus/buses/${busId}/seats`),
        ]);

        const busData = busRes.data?.data || busRes.data;
        const seatsData = seatsRes.data?.data || seatsRes.data || [];

        setBus(busData);
        setSeats(Array.isArray(seatsData) ? seatsData : []);
      } catch {
        toast.error('Failed to load bus seat configuration');
      } finally {
        setFetching(false);
      }
    }

    loadData();
  }, [busId, router]);

  const handleBulkGenerate = async () => {
    if (!confirm(`Generate ${rows * cols * (hasUpperDeck ? 2 : 1)} seats configuration for this bus?`)) return;

    setLoading(true);
    const generatedSeats: any[] = [];

    // Lower deck
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        generatedSeats.push({
          seat_number: `L${r}${String.fromCharCode(64 + c)}`,
          row_num: r,
          col_num: c,
          is_upper_deck: false,
          seat_type: defaultSeatType,
          price_offset: 0,
        });
      }
    }

    // Upper deck if enabled
    if (hasUpperDeck) {
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          generatedSeats.push({
            seat_number: `U${r}${String.fromCharCode(64 + c)}`,
            row_num: r,
            col_num: c,
            is_upper_deck: true,
            seat_type: defaultSeatType,
            price_offset: 50,
          });
        }
      }
    }

    try {
      await apiClient.post(`/bus/buses/${busId}/seats`, {
        seats: generatedSeats,
      });

      toast.success('Seat layout generated and saved successfully!');
      // Reload seats
      const updated = await apiClient.get(`/bus/buses/${busId}/seats`);
      setSeats(updated.data?.data || updated.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate seats');
    } finally {
      setLoading(false);
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
          <Link href="/inventory/buses">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Seat Layout: {bus?.registration_number || 'Coach Configuration'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Type: <span className="font-semibold text-slate-700">{bus?.bus_type}</span> • Total Registered Seats: <span className="font-semibold text-blue-600">{seats.length} configured</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bulk generator settings card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 h-fit">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600" /> Auto Matrix Seat Generator
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Instantly create grid layout coordinates and numbering tags for this coach.
            </p>
          </div>

          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1.5">Number of Rows</label>
              <Input
                type="number"
                min="1"
                max="15"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="h-10 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <label className="block mb-1.5">Columns per Row (e.g. 4 for 2+2 or 3 for 2+1)</label>
              <Input
                type="number"
                min="2"
                max="6"
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="h-10 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <label className="block mb-1.5">Default Berth / Seat Type</label>
              <select
                value={defaultSeatType}
                onChange={(e) => setDefaultSeatType(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
              >
                <option value="SLEEPER">SLEEPER (Flat Bed)</option>
                <option value="SEATER">SEATER (Recliner)</option>
                <option value="SEMI_SLEEPER">SEMI-SLEEPER (Pushback)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="upperDeck"
                checked={hasUpperDeck}
                onChange={(e) => setHasUpperDeck(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <label htmlFor="upperDeck" className="text-xs text-slate-700 font-medium cursor-pointer">
                Include Upper Sleeper Deck (U)
              </label>
            </div>

            <Button
              onClick={handleBulkGenerate}
              disabled={loading}
              className="w-full h-10 bg-[#0066FF] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold gap-2 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Generate & Save Seat Grid
            </Button>
          </div>
        </div>

        {/* Visual Seat Layout Matrix preview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Visual Deck & Seat Map Preview</h3>
              <p className="text-xs text-slate-500">Live preview of passengers seat layout and booking availability tags.</p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              {seats.length} Total Berths
            </span>
          </div>

          {seats.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Armchair className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              No seats generated for this bus yet. Use the Matrix Generator on the left to initialize layout.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lower Deck */}
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                  Lower Deck (L)
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/60 max-h-96 overflow-y-auto">
                  {seats
                    .filter((s) => !s.is_upper_deck)
                    .map((seat) => (
                      <div
                        key={seat.id || seat.seat_number}
                        className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col items-center justify-center text-center shadow-2xs hover:border-blue-400 transition-colors"
                      >
                        <Armchair className="w-4 h-4 text-blue-600 mb-1" />
                        <span className="text-xs font-bold text-slate-900">{seat.seat_number}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{seat.seat_type}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Upper Deck if exists */}
              {seats.some((s) => s.is_upper_deck) && (
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                    Upper Deck (U)
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/60 max-h-96 overflow-y-auto">
                    {seats
                      .filter((s) => s.is_upper_deck)
                      .map((seat) => (
                        <div
                          key={seat.id || seat.seat_number}
                          className="bg-white border border-indigo-200 rounded-lg p-2.5 flex flex-col items-center justify-center text-center shadow-2xs hover:border-indigo-400 transition-colors"
                        >
                          <Armchair className="w-4 h-4 text-indigo-600 mb-1" />
                          <span className="text-xs font-bold text-slate-900">{seat.seat_number}</span>
                          <span className="text-[10px] text-indigo-500 font-medium">Upper Berth</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusSeatsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading seat configuration...</div>}>
      <BusSeatsContent />
    </Suspense>
  );
}
