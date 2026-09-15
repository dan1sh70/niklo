import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, CreditCard, Key, Search, FileText, Settings, TrendingUp, Globe } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">Niklo Admin</h1>
        </div>
        <nav className="p-4 space-y-1">
          <div className="pt-2 pb-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Main</p>
          </div>
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/vendors" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <Users size={20} /> Vendors
          </Link>
          <Link href="/admin/payouts" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <CreditCard size={20} /> Payouts
          </Link>
          <Link href="/admin/subscriptions" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <FileText size={20} /> Subscriptions
          </Link>
          <Link href="/admin/api-keys" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <Key size={20} /> API Keys
          </Link>

          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales & Partners</p>
          </div>
          <Link href="/sales" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <TrendingUp size={20} /> Sales Dashboard
          </Link>
          <Link href="/sales/referrals" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <Users size={20} /> Referrals
          </Link>

          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SEO & Content</p>
          </div>
          <Link href="/seo" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <Globe size={20} /> SEO Dashboard
          </Link>
          <Link href="/seo/blogs" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
            <FileText size={20} /> Blogs & Articles
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-2 rounded-md w-96">
            <Search size={18} />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none w-full text-sm" />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <Settings size={20} />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              A
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
