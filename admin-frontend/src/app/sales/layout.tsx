import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, TrendingUp, HandCoins, Settings, Search } from 'lucide-react';

export default function SalesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r shadow-sm">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold text-green-600">Niklo Sales Panel</h1>
        </div>
        <nav className="p-4 space-y-1">
          <Link href="/sales" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-green-50 hover:text-green-600 transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/sales/referrals" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-green-50 hover:text-green-600 transition-colors">
            <Users size={20} /> Referrals
          </Link>
          <Link href="/sales/commissions" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-green-50 hover:text-green-600 transition-colors">
            <HandCoins size={20} /> Commissions
          </Link>
          <Link href="/sales/reports" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-green-50 hover:text-green-600 transition-colors">
            <TrendingUp size={20} /> Reports
          </Link>
          <Link href="/sales/settings" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-green-50 hover:text-green-600 transition-colors">
            <Settings size={20} /> Settings
          </Link>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-2 rounded-md w-96">
            <Search size={18} />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none w-full text-sm" />
          </div>
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            E
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
