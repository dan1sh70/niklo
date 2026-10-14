/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { MapPin, Plus, Search, Edit3, Trash2, ArrowRight, Flame, Clock, Navigation, ArrowUp, ArrowDown, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import Link from 'next/link';
import { toast } from 'sonner';

export default function RoutesInventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'all' | 'popular'>('all');

  // MOD-7 New Popular Route modal state
  const [showAddPopular, setShowAddPopular] = useState(false);
  const [popularSource, setPopularSource] = useState('');
  const [popularDest, setPopularDest] = useState('');
  const [popularDuration, setPopularDuration] = useState('10h 30m');
  const [popularStartPrice, setPopularStartPrice] = useState(650);
  const [popularTag, setPopularTag] = useState('Most Booked');
  const [popularPriority, setPopularPriority] = useState(10);
  const [popularLoading, setPopularLoading] = useState(false);

  // Standard Routes
  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['admin-bus-routes'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/routes');
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [
          {
            id: '22222222-2222-2222-2222-222222222222',
            source_city: 'Bangalore',
            destination_city: 'Chennai',
            distance_km: 350.0,
            estimated_duration_minutes: 360,
            is_active: true,
            boarding_points: [{ name: 'Majestic' }, { name: 'Silk Board' }],
            dropping_points: [{ name: 'Koyambedu' }, { name: 'Guindy' }],
          },
          {
            id: '22222222-2222-2222-2222-222222222223',
            source_city: 'Ahmedabad',
            destination_city: 'Diu',
            distance_km: 375.0,
            estimated_duration_minutes: 480,
            is_active: true,
            boarding_points: [{ name: 'Geeta Mandir' }, { name: 'Paldi' }],
            dropping_points: [{ name: 'Diu Bus Station' }, { name: 'Nagoa' }],
          },
        ];
      }
    },
  });

  // Popular Routes (MOD-7)
  const { data: popularRoutes, isLoading: isPopLoading } = useQuery({
    queryKey: ['admin-popular-routes'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/popular-routes');
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [
          { id: 'pop-1', source: 'Kolkata', destination: 'Siliguri', duration: '10h 30m', start_price: 650, tag: 'Most Booked', priority: 1, is_active: true },
          { id: 'pop-2', source: 'Kolkata', destination: 'Digha', duration: '4h 15m', start_price: 180, tag: 'Best Value', priority: 2, is_active: true },
          { id: 'pop-3', source: 'Kolkata', destination: 'Darjeeling', duration: '12h 00m', start_price: 750, tag: 'New Route', priority: 3, is_active: true },
        ];
      }
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/bus/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bus-routes'] });
      toast.success('Route deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete route');
    },
  });

  // MOD-7 Create Popular Route
  const handleCreatePopular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popularSource.trim() || !popularDest.trim()) {
      toast.error('Source and Destination required');
      return;
    }

    setPopularLoading(true);
    try {
      await apiClient.post('/bus/popular-routes', {
        source: popularSource.trim(),
        destination: popularDest.trim(),
        duration: popularDuration.trim(),
        start_price: Number(popularStartPrice),
        tag: popularTag,
        priority: Number(popularPriority),
      });

      toast.success('Popular featured route added successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-popular-routes'] });
      setShowAddPopular(false);
      setPopularSource('');
      setPopularDest('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add popular route');
    } finally {
      setPopularLoading(false);
    }
  };

  const filteredRoutes = (routes || []).filter((r: any) =>
    (r.source_city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.destination_city || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Intercity Routes & Corridors</h1>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
              {filteredRoutes.length} Operational Corridors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage route origins, destinations, distances, pickup landmarks, and trending high-traffic showcases.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tab === 'popular' ? (
            <Button
              onClick={() => setShowAddPopular(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2 font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Featured Popular Route
            </Button>
          ) : (
            <Link href="/inventory/routes/new">
              <Button className="bg-[#0066FF] hover:bg-blue-600 text-white gap-2 font-medium shadow-sm">
                <Plus className="w-4 h-4" /> Create New Route
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs and search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 border border-slate-200 p-1 rounded-xl bg-slate-50 w-fit">
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Corridors ({filteredRoutes.length})
          </button>
          <button
            onClick={() => setTab('popular')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              tab === 'popular' ? 'bg-white text-orange-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Popular Showcase & Marketing ({(popularRoutes || []).length})
          </button>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by origin or destination city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white text-sm rounded-xl"
          />
        </div>
      </div>

      {/* View Content */}
      {tab === 'all' ? (
        routesLoading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRoutes.map((route: any) => {
              const totalMins = route.estimated_duration_minutes || 0;
              const displayDuration = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;

              return (
                <div
                  key={route.id}
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">
                        ID: {route.id.slice(0, 8)}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          route.is_active
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {route.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1 font-bold text-slate-900 text-sm">{route.source_city}</div>
                      <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 font-bold text-slate-900 text-sm text-right">
                        {route.destination_city}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Distance:</span>
                        <span className="font-semibold text-slate-800">{route.distance_km || '—'} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Estimated Duration (MOD-4):</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" /> {displayDuration}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Boarding Stops:</span>
                        <span className="font-semibold text-blue-600">
                          {(route.boarding_points || []).length} points configured
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                    <Link href={`/inventory/routes/edit?id=${route.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete route from ${route.source_city} to ${route.destination_city}?`)) {
                          deleteRouteMutation.mutate(route.id);
                        }
                      }}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Popular Routes showcase with MOD-7 Live Previews */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(popularRoutes || []).map((pop: any) => (
            <div
              key={pop.id}
              className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs bg-orange-50 text-orange-600 font-bold px-2.5 py-0.5 rounded-full border border-orange-200">
                  {pop.tag || 'Most Booked'}
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono">Priority #{pop.priority}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-slate-900 text-sm">{pop.source}</span>
                <ArrowRight className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="font-bold text-slate-900 text-sm">{pop.destination}</span>
              </div>

              <div className="bg-orange-50/40 p-3.5 rounded-xl border border-orange-100/60 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-semibold text-slate-800">{pop.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Starting Fare:</span>
                  <span className="font-bold text-emerald-600">₹{pop.start_price}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>User App Live Preview Tag</span>
                <span className="text-orange-600 font-semibold">Featured on Home</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MOD-7 Add Featured Popular Route Modal */}
      {showAddPopular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative space-y-6">
            <button
              onClick={() => setShowAddPopular(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> MOD-7: Featured Popular Route
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Showcase Route On Home Screen</h2>
              <p className="text-xs text-slate-500">Add high-traffic marketing route card with priority sorting.</p>
            </div>

            <form onSubmit={handleCreatePopular} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Source City *</label>
                  <LocationAutocomplete
                    required
                    value={popularSource}
                    onChange={setPopularSource}
                    placeholder="Origin city..."
                  />
                </div>
                <div>
                  <label className="block mb-1">Destination City *</label>
                  <LocationAutocomplete
                    required
                    value={popularDest}
                    onChange={setPopularDest}
                    placeholder="Destination..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Duration String *</label>
                  <Input
                    required
                    placeholder="e.g. 10h 30m"
                    value={popularDuration}
                    onChange={(e) => setPopularDuration(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1">Starting Ticket Fare (₹) *</label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={popularStartPrice}
                    onChange={(e) => setPopularStartPrice(Number(e.target.value))}
                    className="h-10 text-xs font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Marketing Tag *</label>
                  <select
                    value={popularTag}
                    onChange={(e) => setPopularTag(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="Most Booked">🔥 Most Booked</option>
                    <option value="Best Value">⚡ Best Value</option>
                    <option value="New Route">✨ New Route</option>
                    <option value="Top Rated">⭐ Top Rated</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Display Priority (Lower = First)</label>
                  <Input
                    type="number"
                    min="1"
                    value={popularPriority}
                    onChange={(e) => setPopularPriority(Number(e.target.value))}
                    className="h-10 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddPopular(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={popularLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-5"
                >
                  {popularLoading ? 'Adding...' : 'Publish Popular Route'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
