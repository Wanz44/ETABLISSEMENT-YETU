import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  FileText,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../lib/db';
import { Invoice, Tenant, Unit, Payment } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Dashboard() {
  const data = useLiveQuery(async () => {
    return {
      invoices: await dbLocal.invoices.toArray(),
      tenants: await dbLocal.tenants.toArray(),
      units: await dbLocal.units.toArray(),
      payments: await dbLocal.payments.toArray(),
    };
  }) || { invoices: [], tenants: [], units: [], payments: [] };

  const { invoices, tenants, units, payments } = data;

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalUnpaid = invoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.amountPaid), 0);
    const totalTenants = tenants.length;
    const occupiedUnits = units.filter(u => u.status === 'occupied').length;
    const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;

    return {
      totalRevenue,
      totalUnpaid,
      occupancyRate,
      totalTenants
    };
  }, [invoices, tenants, units, payments]);

  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={cn("p-3 rounded-xl", color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          {trend === 'up' ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-500 mr-1" />
          )}
          <span className={trend === 'up' ? "text-emerald-500 font-medium" : "text-rose-500 font-medium"}>
            {trendValue}
          </span>
          <span className="text-muted-foreground ml-2">vs mois dernier</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="text-muted-foreground">Bienvenue sur votre espace de pilotage Etablissement YETU.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Revenus Totaux" 
          value={`${stats.totalRevenue.toLocaleString()} $`} 
          icon={TrendingUp}
          trend="up"
          trendValue="+12.5%"
          color="bg-emerald-500"
        />
        <StatCard 
          title="Total Impayés" 
          value={`${stats.totalUnpaid.toLocaleString()} $`} 
          icon={AlertCircle}
          trend="down"
          trendValue="-2.4%"
          color="bg-rose-500"
        />
        <StatCard 
          title="Taux d'Occupation" 
          value={`${stats.occupancyRate}%`} 
          icon={Building2}
          trend="up"
          trendValue="+5%"
          color="bg-blue-500"
        />
        <StatCard 
          title="Total Locataires" 
          value={stats.totalTenants} 
          icon={Users}
          trend="up"
          trendValue="+3"
          color="bg-violet-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Flux de Trésorerie</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#888' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#888' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f5f5f5' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === revenueData.length - 1 ? '#0f172a' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Activités Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {payments.slice(0, 4).map((payment, i) => {
                const tenant = tenants.find(t => t.id === payment.tenantId);
                return (
                  <div key={i} className="flex items-center">
                    <div className={cn("p-2 rounded-lg bg-muted mr-4 text-emerald-500")}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{tenant?.name || 'Locataire'}</p>
                      <p className="text-xs text-muted-foreground">Paiement reçu • {payment.amount} $</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{format(new Date(payment.date), 'dd MMM', { locale: fr })}</div>
                  </div>
                );
              })}
              {payments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucune activité récente.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
