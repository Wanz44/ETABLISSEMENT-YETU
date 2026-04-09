import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock
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

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUnpaid: 0,
    occupancyRate: 0,
    totalTenants: 0
  });

  const [revenueData, setRevenueData] = useState([
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
  ]);

  useEffect(() => {
    // In a real app, fetch from Firestore
    // For now, using mock data for visual polish
    setStats({
      totalRevenue: 125400,
      totalUnpaid: 15200,
      occupancyRate: 85,
      totalTenants: 42
    });
  }, []);

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
          title="Revenus Mensuels" 
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
              {[
                { user: 'Jean Dupont', action: 'Paiement reçu', amount: '450 $', time: 'Il y a 2h', icon: CreditCard, color: 'text-emerald-500' },
                { user: 'Marie Claire', action: 'Nouveau contrat', amount: 'Magasin B12', time: 'Il y a 5h', icon: FileText, color: 'text-blue-500' },
                { user: 'Robert Smith', action: 'Facture générée', amount: '1,200 $', time: 'Hier', icon: Receipt, color: 'text-amber-500' },
                { user: 'Boutique Mode', action: 'Retard de paiement', amount: '3 mois', time: 'Hier', icon: Clock, color: 'text-rose-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center">
                  <div className={cn("p-2 rounded-lg bg-muted mr-4", item.color)}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.user}</p>
                    <p className="text-xs text-muted-foreground">{item.action} • {item.amount}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
import { CreditCard, FileText, Receipt } from 'lucide-react';
