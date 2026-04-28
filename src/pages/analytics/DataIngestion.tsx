import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Database, Download, ArrowRight, RefreshCw, Layers, History, Activity, ShieldAlert, Globe } from 'lucide-react';
import { Progress } from '../../components/ui/progress';

import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../../lib/db';

export default function DataIngestion() {
  const data = useLiveQuery(async () => {
    return {
      payments: await dbLocal.payments.toArray(),
      tenants: await dbLocal.tenants.toArray(),
      invoices: await dbLocal.invoices.toArray(),
      contracts: await dbLocal.contracts.toArray(),
    };
  }) || { payments: [], tenants: [], invoices: [], contracts: [] };

  const { payments, tenants, invoices, contracts } = data;

  const pipelines = [
    { 
      name: 'Flux Transactions Temps Réel', 
      status: payments.length > 0 ? 'Actif' : 'En attente', 
      load: Math.min(100, Math.floor((payments.length / 50) * 100)), 
      icon: Activity, 
      color: 'text-emerald-500' 
    },
    { 
      name: 'Historique Crédit Bureau', 
      status: 'Synchronisation', 
      load: Math.min(100, Math.floor((contracts.length / 20) * 100)), 
      icon: History, 
      color: 'text-amber-500' 
    },
    { 
      name: 'Interactions Omnicanales', 
      status: 'Actif', 
      load: Math.min(100, Math.floor((tenants.length / 30) * 100)), 
      icon: Download, 
      color: 'text-blue-500' 
    },
    { 
      name: 'Données Réglementaires KYC', 
      status: tenants.length > 0 ? 'Audit en cours' : 'Zéro donnée', 
      load: tenants.length > 0 ? Math.min(100, Math.floor((tenants.filter(t => t.idNumber).length / tenants.length) * 100)) : 0, 
      icon: ShieldAlert, 
      color: 'text-rose-500' 
    },
    { 
      name: 'External Market Feeds', 
      status: 'Vérification', 
      load: 15, 
      icon: Globe, 
      color: 'text-violet-500' 
    },
  ];

  const totalBytes = payments.length * 500 + invoices.length * 800 + tenants.length * 1200;
  const volumeDaily = (totalBytes / 1024).toFixed(2);

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-xl shadow-black/5 bg-white overflow-hidden">
          <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Pipelines d'Ingestion ETL/ELT</CardTitle>
                <CardDescription className="text-xs font-bold uppercase opacity-60">Collecte et structuration des flux hétérogènes</CardDescription>
              </div>
              <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full animate-pulse">Live Monitoring</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {pipelines.map((p, i) => (
              <div key={i} className="flex items-center gap-6 p-4 bg-muted/20 rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all group">
                <div className={`p-4 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform ${p.color}`}>
                  <p.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-tight">{p.name}</h4>
                      <p className="text-[10px] font-black text-muted-foreground uppercase">{p.status}</p>
                    </div>
                    <span className="text-xs font-black italic">{p.load}%</span>
                  </div>
                  <Progress value={p.load} className="h-2 rounded-full" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-primary text-primary-foreground p-8 relative overflow-hidden">
            <Database className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 rotate-12" />
            <div className="relative z-10 space-y-6">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight">Sources de<br />Données Alpha</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-2 italic">Connecteurs API & Flux Temps Réel</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Swift & Payment Gateways</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white/50" />
                  <span className="text-[11px] font-black uppercase tracking-widest">CRM & Mobile Analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white/50" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Regulatory Open Banking</span>
                </div>
              </div>
              <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 shadow-2xl shadow-black/20">Configurer l'Ingestion</Button>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-xl shadow-black/5 bg-white p-8">
            <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground mb-4">Statistiques Consolidées</h4>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tighter">Volume Ingestéré (Calculé)</span>
                <span className="text-lg font-black text-primary">{volumeDaily} KB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tighter">Latence Moyenne</span>
                <span className="text-lg font-black text-emerald-600">45ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tighter">Taux d'Erreur</span>
                <span className="text-lg font-black text-rose-600">0.02%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
