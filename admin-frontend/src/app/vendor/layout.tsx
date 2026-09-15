import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Bus, Map, FileText, CreditCard, LogOut } from 'lucide-react';

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white shadow-sm flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-teal-400">Vendor Portal</h1>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          <Link href="/vendor" className="flex items-center gap-3 px-3 py-2 text-slate-300 rounded-md hover:bg-slate-800 hover:text-white">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/vendor/vehicles" className="flex items-center gap-3 px-3 py-2 text-slate-300 rounded-md hover:bg-slate-800 hover:text-white">
            <Bus size={20} /> My Fleet
          </Link>
          <Link href="/vendor/routes" className="flex items-center gap-3 px-3 py-2 text-slate-300 rounded-md hover:bg-slate-800 hover:text-white">
            <Map size={20} /> Routes
          </Link>
          <Link href="/vendor/bookings" className="flex items-center gap-3 px-3 py-2 text-slate-300 rounded-md hover:bg-slate-800 hover:text-white">
            <FileText size={20} /> Bookings
          </Link>
          <Link href="/vendor/wallet" className="flex items-center gap-3 px-3 py-2 text-slate-300 rounded-md hover:bg-slate-800 hover:text-white">
            <CreditCard size={20} /> Earnings & Wallet
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button className="flex w-full items-center gap-3 px-3 py-2 text-slate-400 rounded-md hover:bg-slate-800 hover:text-red-400 transition-colors">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-end px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">John Travels</p>
              <p className="text-xs text-gray-500">Pro Plan (Active)</p>
            </div>
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
              JT
            </div>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
