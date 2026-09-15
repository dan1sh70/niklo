import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileEdit, BarChart, Settings, Search } from 'lucide-react';

export default function SeoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r shadow-sm">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold text-indigo-600">Niklo SEO Panel</h1>
        </div>
        <nav className="p-4 space-y-1">
          <Link href="/seo" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            <LayoutDashboard size={20} /> Overview
          </Link>
          <Link href="/seo/blogs" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            <FileEdit size={20} /> Blogs & Content
          </Link>
          <Link href="/seo/analytics" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            <BarChart size={20} /> Analytics
          </Link>
          <Link href="/seo/settings" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            <Settings size={20} /> Meta Settings
          </Link>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-2 rounded-md w-96">
            <Search size={18} />
            <input type="text" placeholder="Search keywords..." className="bg-transparent border-none outline-none w-full text-sm" />
          </div>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            S
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
