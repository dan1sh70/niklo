/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { HelpCircle, MessageSquare, PhoneCall, Mail, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SupportPage() {
  const [tickets, setTickets] = useState([
    {
      id: 'TCK-8092',
      customer: 'Rahul Mehta',
      service: 'Bus Booking #NKL126783',
      subject: 'Boarding point pickup timing confirmation',
      priority: 'HIGH',
      status: 'OPEN',
      time: '12 min ago',
    },
    {
      id: 'TCK-8091',
      customer: 'Priya Shah',
      service: 'Hotel Booking #NKL126782',
      subject: 'Late check-in notification for Praveg Resort',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      time: '2 hours ago',
    },
    {
      id: 'TCK-8090',
      customer: 'Amit Kumar',
      service: 'Cab Booking #NKL126781',
      subject: 'Luggage capacity confirmation for Sedan',
      priority: 'LOW',
      status: 'RESOLVED',
      time: '1 day ago',
    },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          Customer Support & Helpdesk
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage passenger support queries, tickets, and escalation channels across all services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">12</div>
            <div className="text-xs font-semibold text-slate-400">Open Tickets</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">480</div>
            <div className="text-xs font-semibold text-slate-400">Resolved This Month</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">4.2 min</div>
            <div className="text-xs font-semibold text-slate-400">Average Response Time</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Active Customer Inquiries</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {tickets.map(t => (
            <div key={t.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900">{t.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {t.priority}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{t.time}</span>
                </div>
                <div className="font-bold text-sm text-slate-800">{t.subject}</div>
                <div className="text-xs text-slate-500">{t.customer} • {t.service}</div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  t.status === 'OPEN' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {t.status}
                </span>
                <Button size="sm" variant="outline" className="rounded-xl text-xs">
                  Respond
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
