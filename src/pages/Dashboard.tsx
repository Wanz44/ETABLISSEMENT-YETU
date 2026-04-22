import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileText,
  Receipt,
  Bell,
  Zap,
  PieChart,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const data = useLiveQuery(async () => {
    return {
      invoices: await dbLocal.invoices.toArray(),
      tenants: await dbLocal.tenants.toArray(),
      units: await dbLocal.units.toArray(),
      payments: await dbLocal.payments.toArray(),
      expenses: await dbLocal.expenses.toArray(),
      notifications: await dbLocal.notifications.orderBy('date').reverse().limit(4).toArray()
    };
  }) || { invoices: [], tenants: [], units: [], payments: [], expenses: [], notifications: [] };

  const { invoices, tenants, units, payments, expenses, notifications } = data;

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalUnpaid = invoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.amountPaid), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const occupiedUnits = units.filter(u => u.status === 'occupied').length;
    const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;

    return {
      totalRevenue,
      totalUnpaid,
      totalExpenses,
      occupancyRate
    };
  }, [invoices, tenants, units, payments, expenses]);

  const revenueData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    return months.map((name, i) => ({
      name,
      revenue: payments.filter(p => new Date(p.date).getMonth() === i).reduce((sum, p) => sum + p.amount, 0) || 0
    }));
  }, [payments]);

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1F36]">Portail Institutionnel</h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">Vue d'ensemble de la santé financière du parc immobilier.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/analytics">
            <Button variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 text-primary font-bold">
              <PieChart className="w-4 h-4 mr-2" /> Analyses Pro
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Revenus Encaissés" 
          value={`${stats.totalRevenue.toLocaleString()} $`} 
          trend="+12.5%" 
          trendUp={true}
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Encours Impayés" 
          value={`${stats.totalUnpaid.toLocaleString()} $`} 
          trend="-2.4%" 
          trendUp={false}
          icon={Receipt}
          color="bg-rose-500"
        />
        <StatCard 
          title="Taux d'Occupation" 
          value={`${stats.occupancyRate}%`} 
          trend="+5%" 
          trendUp={true}
          icon={Building2}
          color="bg-blue-600"
        />
        <StatCard 
          title="Dépenses Globales" 
          value={`${stats.totalExpenses.toLocaleString()} $`} 
          trend="+1.2%" 
          trendUp={false}
          icon={TrendingDown}
          color="bg-violet-600"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-8">
           <Card className="rounded-2xl border border-[#E1E5EB] bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-[#F3F5F8]">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold text-[#1A1F36]">Flux de Trésorerie Institutionnel</CardTitle>
                  <CardDescription className="text-xs">Performance consolidée des encaissements par exercice mensuel.</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-primary"></div>
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actuel</span>
                   </div>
                   <div className="p-2 bg-muted rounded-lg">
                      <PieChart className="w-4 h-4 text-muted-foreground" />
                   </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                      {revenueData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === revenueData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.4)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Raccourcis Stratégiques
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/invoices" className="group">
                <div className="bg-emerald-500 p-6 rounded-[2rem] text-white shadow-lg shadow-emerald-500/20 hover:shadow-2xl hover:scale-[1.02] transition-all relative overflow-hidden h-full">
                   <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                     <FileText className="w-32 h-32" />
                   </div>
                   <h4 className="font-black text-lg">Facturation Rapide</h4>
                   <p className="text-xs opacity-80 mt-1 font-medium italic">Gérez les loyers du mois en un clic.</p>
                   <div className="mt-6 inline-flex items-center text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                     Accéder <ArrowUpRight className="w-3 h-3 ml-1" />
                   </div>
                </div>
              </Link>
              <Link to="/contracts" className="group">
                <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-lg shadow-blue-600/20 hover:shadow-2xl hover:scale-[1.02] transition-all relative overflow-hidden h-full">
                   <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                     <Users className="w-32 h-32" />
                   </div>
                   <h4 className="font-black text-lg">Nouveau Contrat</h4>
                   <p className="text-xs opacity-80 mt-1 font-medium italic">Enregistrez un nouveau locataire.</p>
                   <div className="mt-6 inline-flex items-center text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                     Accéder <ArrowUpRight className="w-3 h-3 ml-1" />
                   </div>
                </div>
              </Link>
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Card className="rounded-2xl border border-[#E1E5EB] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-[#F3F5F8]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-[#1A1F36]">Flux Récents</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Opérations de Trésorerie</p>
                </div>
                <Link to="/payments" className="text-[10px] font-black uppercase text-primary hover:underline hover:translate-x-1 transition-transform inline-flex items-center gap-1">Gestion <ArrowUpRight className="w-3 h-3" /></Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                {payments.slice(0, 5).map((payment, i) => {
                  const tenant = tenants.find(t => t.id === payment.tenantId);
                  return (
                    <div key={i} className="flex items-center group cursor-pointer border-b border-[#F3F5F8] last:border-0 pb-4 last:pb-0">
                      <div className={cn("w-10 h-10 rounded-lg bg-[#F8F9FB] flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all")}>
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A1F36] truncate">{tenant?.name || 'Client Institutionnel'}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                          {format(new Date(payment.date), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-bold text-emerald-600">+{payment.amount} $</p>
                        <p className="text-[9px] font-mono font-medium text-muted-foreground uppercase opacity-50 tracking-tighter">REF-{String(payment.id).slice(0, 5).toUpperCase()}</p>
                      </div>
                    </div>
                  );
                })}
                {payments.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-muted-foreground italic">Aucun paiement.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <section>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              Intelligence
            </h3>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-4 rounded-[1.5rem] bg-card border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    notif.type === 'success' ? 'bg-emerald-500' : 'bg-primary'
                  )}></div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{notif.title}</h4>
                  <p className="text-xs font-semibold mt-1 leading-snug">{notif.message}</p>
                  <p className="text-[9px] text-muted-foreground mt-2 opacity-60 font-medium">Il y a quelques instants</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center p-8 bg-muted/20 border-2 border-dashed rounded-[2rem]">
                  <p className="text-xs text-muted-foreground font-medium italic">Aucune alerte pour le moment.</p>
                </div>
              )}
            </div>
          </section>

          <div className="rounded-[2.5rem] p-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden">
             <ShieldCheck className="w-20 h-20 absolute -right-4 -bottom-4 opacity-10" />
             <div className="relative z-10 space-y-4">
                <h4 className="text-lg font-black leading-tight">Architecture Local-First</h4>
                <p className="text-xs opacity-80 leading-relaxed font-medium">Sécurité maximale : vos données ne sortent jamais de cet appareil. Rapidité garantie même sans internet.</p>
                <Link to="/database">
                  <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white text-white hover:text-primary rounded-2xl font-bold py-6">
                    Audit de la base
                  </Button>
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color }: any) {
  return (
    <Card className="rounded-2xl border border-[#E1E5EB] bg-white shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-lg bg-primary/5 text-primary")}>
             <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tight",
            trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#697386]">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-[#1A1F36] mt-0.5">{value}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Analyse Active</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
