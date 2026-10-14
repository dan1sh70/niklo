/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, Armchair, RefreshCw, Check, Sparkles } from 'lucide-react';
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

  // Generator matrix state
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(4);
  const [hasUpperDeck, setHasUpperDeck] = useState(false);
  const [defaultSeatType, setDefaultSeatType] = useState<'SLEEPER' | 'SEATER'>('SLEEPER');

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
        if (Array.isArray(seatsData) && seatsData.length > 0) {
          setSeats(seatsData);
        } else if (busData?.total_seats) {
          // Infer default grid matching total_seats
          const inferredCols = 4;
          const inferredRows = Math.ceil(busData.total_seats / inferredCols);
          setRows(inferredRows);
          setCols(inferredCols);
        }
      } catch {
        toast.error('Failed to load bus seat configuration');
      } finally {
        setFetching(false);
      }
    }

    loadData();
  }, [busId, router]);

  // Generate matrix in state for interactive editing before save
  const handleGenerateGrid = () => {
    const list: any[] = [];
    const colLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    // Lower deck
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        list.push({
          seat_number: `${r}${colLetters[c - 1] || c}`,
          row_num: r,
          col_num: c,
          is_upper_deck: false,
          seat_type: defaultSeatType,
          price_offset: 0,
          is_available: true,
          is_ladies_seat: false,
        });
      }
    }

    // Upper deck if checked
    if (hasUpperDeck) {
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          list.push({
            seat_number: `U${r}${colLetters[c - 1] || c}`,
            row_num: r,
            col_num: c,
            is_upper_deck: true,
            seat_type: defaultSeatType,
            price_offset: 50,
            is_available: true,
            is_ladies_seat: false,
          });
        }
      }
    }

    setSeats(list);
    toast.success(`Generated ${list.length} interactive seat cards in grid`);
  };

  const updateSeat = (index: number, field: string, val: any) => {
    setSeats((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSaveAllSeats = async () => {
    if (seats.length === 0) {
      toast.error('Please generate or configure seats first');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/bus/buses/${busId}/seats`, {
        seats: seats.map((s) => ({
          seat_number: s.seat_number,
          is_upper_deck: Boolean(s.is_upper_deck),
          row_num: Number(s.row_num),
          col_num: Number(s.col_num),
          seat_type: s.seat_type || 'SLEEPER',
          price_offset: Number(s.price_offset || 0),
          is_available: s.is_available !== undefined ? Boolean(s.is_available) : true,
          is_ladies_seat: Boolean(s.is_ladies_seat),
        })),
      });

      toast.success('All seats saved and synchronized to bus!');
      router.push('/inventory/buses');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to bulk save seats');
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/inventory/buses">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Visual Seat Map Builder: {bus?.registration_number || 'Coach'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Bus Type: <span className="font-semibold text-slate-700">{bus?.bus_type}</span> • Total Capacity:{' '}
              <span className="font-semibold text-blue-600">{bus?.total_seats} registered berths</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveAllSeats}
            disabled={loading || seats.length === 0}
            className="bg-[#0066FF] hover:bg-blue-600 text-white font-bold px-6 h-11 rounded-xl gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving Layout...' : `Save All ${seats.length} Seats`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 h-fit">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600" /> Matrix Dimension Setup
            </h3>
            <p className="text-xs text-slate-500 mt-1">Configure layout grid rows & columns.</p>
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
                className="h-10 rounded-xl bg-slate-50"
              />
            </div>

            <div>
              <label className="block mb-1.5">Columns (4 for 2+2, 3 for 2+1)</label>
              <Input
                type="number"
                min="2"
                max="6"
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="h-10 rounded-xl bg-slate-50"
              />
            </div>

            <div>
              <label className="block mb-1.5">Default Berth Style</label>
              <select
                value={defaultSeatType}
                onChange={(e) => setDefaultSeatType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
              >
                <option value="SLEEPER">SLEEPER (Flat Berth)</option>
                <option value="SEATER">SEATER (Pushback)</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="upperDeckToggle"
                checked={hasUpperDeck}
                onChange={(e) => setHasUpperDeck(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <label htmlFor="upperDeckToggle" className="text-xs text-slate-700 cursor-pointer">
                Include Upper Deck (U)
              </label>
            </div>

            <Button
              onClick={handleGenerateGrid}
              variant="outline"
              className="w-full h-10 rounded-xl text-xs font-bold gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-Generate Layout Grid
            </Button>
          </div>
        </div>

        {/* Visual Seat Cards Editor (MOD-3) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Interactive Seat Cards Builder</h3>
              <p className="text-xs text-slate-500">
                Click any toggle to set Ladies-Only, Upper Deck, Type, or custom Price Offset.
              </p>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
              {seats.length} Configured Seats
            </span>
          </div>

          {seats.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <Armchair className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              Click "Re-Generate Layout Grid" to build visual seat cards for this coach.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto p-2 bg-slate-50/60 rounded-2xl border border-slate-100">
              {seats.map((seat, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border bg-white shadow-2xs space-y-2 transition-all ${
                    seat.is_ladies_seat
                      ? 'border-purple-300 bg-purple-50/20'
                      : seat.is_upper_deck
                      ? 'border-indigo-300 bg-indigo-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Armchair
                        className={`w-4 h-4 ${
                          seat.is_ladies_seat
                            ? 'text-purple-600'
                            : seat.is_upper_deck
                            ? 'text-indigo-600'
                            : 'text-blue-600'
                        }`}
                      />
                      <Input
                        value={seat.seat_number}
                        onChange={(e) => updateSeat(idx, 'seat_number', e.target.value.toUpperCase())}
                        className="w-16 h-7 font-bold text-xs uppercase p-1 rounded-md"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      R{seat.row_num}C{seat.col_num}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        updateSeat(idx, 'seat_type', seat.seat_type === 'SLEEPER' ? 'SEATER' : 'SLEEPER')
                      }
                      className={`p-1 rounded font-semibold border ${
                        seat.seat_type === 'SLEEPER'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {seat.seat_type}
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSeat(idx, 'is_ladies_seat', !seat.is_ladies_seat)}
                      className={`p-1 rounded font-semibold border ${
                        seat.is_ladies_seat
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {seat.is_ladies_seat ? 'Ladies' : 'Any'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                    <span className="text-slate-400">Offset (₹):</span>
                    <Input
                      type="number"
                      value={seat.price_offset || 0}
                      onChange={(e) => updateSeat(idx, 'price_offset', Number(e.target.value))}
                      className="w-20 h-6 text-xs p-1 rounded-md text-right font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusSeatsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading seat builder...</div>}>
      <BusSeatsContent />
    </Suspense>
  );
}
