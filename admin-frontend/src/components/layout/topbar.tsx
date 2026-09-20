'use client';

import { Search, Bell, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Topbar() {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Global search (⌘K)..." 
            className="w-full pl-9 bg-background"
          />
        </div>
        <div className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent/10 text-accent border border-accent/20">
          STAGING
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-muted">
          <User className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
