'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BusFront, Users, Wallet, CheckSquare, BarChart, Settings, FileText, LayoutDashboard, Ticket, Key, TrendingUp, Activity, Server
} from 'lucide-react';

const navGroups = [
  {
    title: 'Operate',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Approvals', href: '/approvals', icon: CheckSquare },
    ]
  },
  {
    title: 'Supply',
    items: [
      { name: 'Vendors', href: '/vendors', icon: Users },
      { name: 'Subscriptions', href: '/subscriptions', icon: FileText },
      { name: 'Schedules', href: '/schedules', icon: BusFront },
    ]
  },
  {
    title: 'Demand',
    items: [
      { name: 'Bookings', href: '/bookings', icon: Ticket },
      { name: 'Users', href: '/users', icon: Users },
    ]
  },
  {
    title: 'Money',
    items: [
      { name: 'Payouts', href: '/payouts', icon: Wallet },
      { name: 'Refunds', href: '/refunds', icon: FileText },
    ]
  },
  {
    title: 'Growth',
    items: [
      { name: 'Sales & Referrals', href: '/sales', icon: TrendingUp },
    ]
  },
  {
    title: 'Content & SEO',
    items: [
      { name: 'Blogs', href: '/seo/blogs', icon: FileText },
    ]
  },
  {
    title: 'Platform',
    items: [
      { name: 'API Providers', href: '/api-keys', icon: Key },
      { name: 'System', href: '/system', icon: Server },
      { name: 'Audit Logs', href: '/audit', icon: Activity },
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Reports', href: '/reports', icon: BarChart },
    ]
  }
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn('w-64 bg-card border-r flex flex-col h-screen', className)}>
      <div className="h-16 flex items-center px-6 border-b">
        <span className="font-bold text-xl tracking-tight text-primary">Niklo Admin</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-6 px-4">
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-accent text-accent-foreground" 
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
