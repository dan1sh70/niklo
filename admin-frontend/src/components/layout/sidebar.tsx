'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  Ticket,
  Bus,
  Car,
  Building2,
  Plane,
  Train,
  Waves,
  Package,
  Users,
  Store,
  Layers,
  CreditCard,
  BarChart3,
  Megaphone,
  Search,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Send
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: {
    name: string;
    href?: string;
    icon: any;
    subItems?: NavItem[];
  }[];
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    Bookings: true,
    Inventory: false,
    Payments: false,
    Reports: false,
  });

  const toggleSubMenu = (name: string) => {
    setOpenSubMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className={cn('w-64 bg-white border-r border-slate-100 flex flex-col h-screen select-none shrink-0 shadow-sm', className)}>
      {/* Brand Header */}
      <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-2xl tracking-tight text-[#0066FF]">Niklo</span>
            <Send className="w-4 h-4 text-[#0066FF] fill-[#0066FF] -rotate-45" />
          </div>
        </Link>
        <span className="text-[10px] text-slate-400 font-medium tracking-wide">Kahi Bhi, Kabhi Bhi</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
        {/* Dashboard Direct Item */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all",
            pathname === '/' 
              ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/20" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>

        {/* Bookings Dropdown Group */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => toggleSubMenu('Bookings')}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname.startsWith('/bookings') 
                ? "text-[#0066FF] bg-blue-50/70" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-3.5">
              <Ticket className="w-4 h-4" />
              <span>Bookings</span>
            </div>
            {openSubMenus['Bookings'] ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSubMenus['Bookings'] && (
            <div className="mt-1 pl-4 space-y-0.5 border-l-2 border-slate-100 ml-4">
              {[
                { name: 'Bus', href: '/bookings/bus', icon: Bus },
                { name: 'Cab', href: '/bookings/cab', icon: Car },
                { name: 'Hotels', href: '/bookings/hotels', icon: Building2 },
                { name: 'Flights', href: '/bookings/flights', icon: Plane },
                { name: 'Trains', href: '/bookings/trains', icon: Train },
                { name: 'Water Sports', href: '/bookings/water-sports', icon: Waves },
                { name: 'Tour Packages', href: '/bookings/tour-packages', icon: Package },
              ].map(sub => {
                const isActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.name}
                    href={sub.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      isActive
                        ? "text-[#0066FF] bg-blue-50/80 font-semibold"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    )}
                  >
                    <sub.icon className="w-3.5 h-3.5" />
                    {sub.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Users */}
        <Link
          href="/users"
          className={cn(
            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname === '/users' 
              ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/20" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Users className="w-4 h-4" />
          Users
        </Link>

        {/* Vendors */}
        <Link
          href="/vendors"
          className={cn(
            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname === '/vendors' 
              ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/20" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Store className="w-4 h-4" />
          Vendors
        </Link>

        {/* Inventory Group */}
        <div>
          <button
            type="button"
            onClick={() => toggleSubMenu('Inventory')}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname.startsWith('/inventory') || pathname.startsWith('/schedules')
                ? "text-[#0066FF] bg-blue-50/70" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-3.5">
              <Layers className="w-4 h-4" />
              <span>Inventory</span>
            </div>
            {openSubMenus['Inventory'] ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSubMenus['Inventory'] && (
            <div className="mt-1 pl-4 space-y-0.5 border-l-2 border-slate-100 ml-4">
              <Link
                href="/schedules"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  pathname === '/schedules' ? "text-[#0066FF] bg-blue-50 font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Bus Schedules
              </Link>
              <Link
                href="/inventory/hotels"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  pathname === '/inventory/hotels' ? "text-[#0066FF] bg-blue-50 font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Hotel Rooms
              </Link>
              <Link
                href="/inventory/adventures"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  pathname === '/inventory/adventures' ? "text-[#0066FF] bg-blue-50 font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Water Sports & Activities
              </Link>
              <Link
                href="/inventory/packages"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  pathname === '/inventory/packages' ? "text-[#0066FF] bg-blue-50 font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Tour Packages
              </Link>
            </div>
          )}
        </div>

        {/* Payments Group */}
        <div>
          <button
            type="button"
            onClick={() => toggleSubMenu('Payments')}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname.startsWith('/payouts') || pathname.startsWith('/refunds') || pathname.startsWith('/approvals')
                ? "text-[#0066FF] bg-blue-50/70" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-3.5">
              <CreditCard className="w-4 h-4" />
              <span>Payments</span>
            </div>
            {openSubMenus['Payments'] ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {openSubMenus['Payments'] && (
            <div className="mt-1 pl-4 space-y-0.5 border-l-2 border-slate-100 ml-4">
              <Link
                href="/payouts"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  pathname === '/payouts' ? "text-[#0066FF] bg-blue-50 font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Vendor Payouts
              </Link>
              <Link
                href="/refunds"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  pathname === '/refunds' ? "text-[#0066FF] bg-blue-50 font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Refunds
              </Link>
              <Link
                href="/approvals"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  pathname === '/approvals' ? "text-[#0066FF] bg-blue-50 font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Maker-Checker Approvals
              </Link>
            </div>
          )}
        </div>

        {/* Reports */}
        <Link
          href="/reports"
          className={cn(
            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname === '/reports' 
              ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/20" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          Reports
        </Link>

        {/* Marketing */}
        <Link
          href="/sales"
          className={cn(
            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname === '/sales' 
              ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/20" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Megaphone className="w-4 h-4" />
          Marketing & Referrals
        </Link>

        {/* CMS / SEO */}
        <Link
          href="/seo/blogs"
          className={cn(
            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname.startsWith('/seo') 
              ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/20" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Search className="w-4 h-4" />
          CMS / SEO
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname === '/settings' 
              ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/20" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        {/* Support */}
        <Link
          href="/support"
          className={cn(
            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname === '/support' 
              ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/20" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <HelpCircle className="w-4 h-4" />
          Support
        </Link>
      </div>

      {/* Bottom Promo Card */}
      <div className="p-4 border-t border-slate-100">
        <div className="relative rounded-2xl overflow-hidden p-4 text-white bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md">
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-bold text-base">Niklo</span>
              <Send className="w-3 h-3 -rotate-45 fill-white" />
            </div>
            <p className="text-[11px] text-blue-100/90 leading-tight mb-2">
              Kahi Bhi, Kabhi Bhi
            </p>
            <div className="text-[11px] font-medium text-white/90 italic">
              "More People More Experiences"
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>
    </aside>
  );
}
