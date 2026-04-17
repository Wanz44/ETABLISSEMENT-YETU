import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../lib/db';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Home, 
  DollarSign, 
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const data = useLiveQuery(async () => {
    const invoices = await dbLocal.invoices.toArray();
    const payments = await dbLocal.payments.toArray();
    const expenses = await dbLocal.expenses.toArray();
    const tenants = await dbLocal.tenants.toArray();
    const units = await dbLocal.units.toArray();
    const contracts = await dbLocal.contracts.toArray();

    // Monthly data preparation
    const monthsNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = monthsNames.map((name, index) => {
      const monthCount = index + 1;
      const monthlyInvoices = invoices.filter(i => i.month === monthCount && i.year === currentYear);
      const monthlyPayments = payments.filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });
      const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });

      return {
        name,
        revenus: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
        facture: monthlyInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
        depenses: monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
      };
    });

    // Strategy distribution
    const occupancy = [
      { name: 'Occupé', value: units.filter(u => u.status === 'occupied').length },
      { name: 'Libre', value: units.filter(u => u.status === 'free').length },
      { name: 'Maintenance', value: units.filter(u => u.status === 'maintenance').length },
    ];

    // Total metrics
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const rentability = totalRevenue - totalExpenses;

    return {
      monthlyData,
      occupancy,
      totalRevenue,
      totalExpenses,
      rentability,
      counts: {
        tenants: tenants.length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
        units: units.length,
        occupancyRate: Math.round((units.filter(u => u.status === 'occupied').length / units.length) * 100) || 0
      }
    };
  }) || { monthlyData: [], occupancy: [], totalRevenue: 0, totalExpenses: 0, rentability: 0, counts: { tenants: 0, activeContracts: 0, units: 0, occupancyRate: 0 } };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analyses de Performance</h2>
          <p className="text-muted-foreground">Indicateurs clés et santé financière du parc immobilier.</p>
        </div>
        <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Live Analysis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Taux d'Occupation" 
          value={`${data.counts.occupancyRate}%`} 
          subValue={`${data.counts.activeContracts} contrats actifs`} 
          icon={Home} 
          trend={+5.2}
        />
        <MetricCard 
          title="Chiffre d'Affaire" 
          value={`${data.totalRevenue.toLocaleString()} $`} 
          subValue="Total encaissé" 
          icon={DollarSign} 
          trend={+12.5}
        />
        <MetricCard 
          title="Rentabilité Nette" 
          value={`${data.rentability.toLocaleString()} $`} 
          subValue="Revenu - Dépenses" 
          icon={TrendingUp} 
          trend={+8.1}
          positive={data.rentability >= 0}
        />
        <MetricCard 
          title="Total Locataires" 
          value={data.counts.tenants} 
          subValue="Individus & Sociétés" 
          icon={Users} 
          trend={+2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-xl shadow-foreground/5 bg-card overflow-hidden">
          <CardHeader>
            <CardTitle>Revenus vs Dépenses</CardTitle>
            <CardDescription>Comparaison mensuelle pour l'année en cours.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenus" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="depenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-xl shadow-foreground/5 bg-card overflow-hidden">
          <CardHeader>
            <CardTitle>Occupation</CardTitle>
            <CardDescription>Répartition par statut des unités.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.occupancy}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.occupancy.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-6 pb-6 flex justify-center gap-4">
            {data.occupancy.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-none shadow-xl shadow-foreground/5 bg-card">
          <CardHeader>
            <CardTitle>Facturation vs Encaissements</CardTitle>
            <CardDescription>Efficacité du recouvrement par mois.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="facture" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenus" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-xl shadow-foreground/5 bg-card">
          <CardHeader>
            <CardTitle>Croissance des Revenus</CardTitle>
            <CardDescription>Tendance linéaire des paiements.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenus" stroke="#10b981" strokeWidth={4} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subValue, icon: Icon, trend, positive = true }: any) {
  return (
    <Card className="rounded-[2rem] border-none shadow-xl shadow-foreground/5 bg-card overflow-hidden hover:scale-[1.02] transition-transform duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="w-6 h-6" />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
            positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-black mt-1">{value}</h3>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">{subValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
