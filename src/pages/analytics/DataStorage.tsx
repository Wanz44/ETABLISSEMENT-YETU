import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Cloud, Server, Database, Share2, Cog, Cpu, LayoutGrid, Box, ShieldCheck, Zap } from 'lucide-react';

import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../../lib/db';

export default function DataStorage() {
  const stats = useLiveQuery(async () => {
    return {
      centers: await dbLocal.centers.count(),
      tenants: await dbLocal.tenants.count(),
      contracts: await dbLocal.contracts.count(),
      payments: await dbLocal.payments.count()
    };
  }) || { centers: 0, tenants: 0, contracts: 0, payments: 0 };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ArchitectureMetric icon={Database} label="Centres Commerciaux" value={`${stats.centers} Doc(s)`} subValue="Entités de structure" color="bg-blue-500" />
        <ArchitectureMetric icon={LayoutGrid} label="Répertoire Locataires" value={`${stats.tenants} Doc(s)`} subValue="Données Identitaires" color="bg-emerald-500" />
        <ArchitectureMetric icon={Zap} label="Titres & Actes" value={`${stats.contracts} Doc(s)`} subValue="Engagements Juridiques" color="bg-amber-500" />
        <ArchitectureMetric icon={ShieldCheck} label="Flux de Paiements" value={`${stats.payments} Doc(s)`} subValue="Transactions Auditées" color="bg-violet-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-[#F3F5F8]">
            <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Cloud className="w-6 h-6 text-primary" />
              Architecture Lakehouse Hybride (Local)
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase opacity-60 italic tracking-widest">Convergence du stockage et de l'analyse stratégique</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="relative h-[300px] flex items-center justify-center border-2 border-dashed border-[#E1E5EB] rounded-[2rem] bg-muted/5">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center border-2 border-primary/20">
                    <Database className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Dexie DB</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                   <div className="w-12 h-1 bg-primary/20 rounded-full mb-1" />
                   <div className="w-12 h-1 bg-primary rounded-full mb-1 animate-pulse" />
                   <div className="w-12 h-1 bg-primary/20 rounded-full" />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary shadow-xl flex items-center justify-center">
                    <Cpu className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Compute Engine</span>
                </div>
              </div>
              <div className="absolute bottom-8 left-8 right-8 flex justify-between px-10">
                <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-widest bg-white">Local Node</Badge>
                <div className="flex gap-2">
                  <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-widest bg-blue-50 text-blue-600 border-blue-100">Indexé</Badge>
                  <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-widest bg-orange-50 text-orange-600 border-orange-100">Persistant</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-[#1A1F36] text-white p-8">
           <div className="flex justify-between items-start mb-8">
             <div>
               <h3 className="text-2xl font-black uppercase tracking-tighter italic">Spécifications BDD Locale</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">Configuration du stockage IndexedDB optimisé</p>
             </div>
             <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
               <Server className="w-6 h-6 text-primary" />
             </div>
           </div>
           
           <div className="space-y-6">
             <SpecLine label="Nombre Total de Documents" value={`${stats.centers + stats.tenants + stats.contracts + stats.payments} Entrées`} />
             <SpecLine label="Moteur de Stockage" value="Dexie.js / IndexedDB" />
             <SpecLine label="Taille Estimée" value={`${((stats.payments * 0.5 + stats.tenants * 1.2)).toFixed(2)} KB`} />
             <SpecLine label="Temps de Requêtage" value="< 50ms (Query Local)" />
             <SpecLine label="Système" value="Full Client-Side Sync" />
           </div>

           <Button className="w-full mt-10 bg-primary text-white hover:bg-primary/90 rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-2xl shadow-black">
             Nettoyer les données (Reset Local)
           </Button>
        </Card>
      </div>
    </div>
  );
}

function ArchitectureMetric({ icon: Icon, label, value, subValue, color }: any) {
  return (
    <Card className="rounded-3xl border-none shadow-xl shadow-black/5 bg-white p-6 group hover:shadow-2xl transition-all duration-500">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-black/10 group-hover:rotate-12 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="mt-6 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{label}</p>
        <h4 className="text-lg font-black uppercase tracking-tighter text-[#1A1F36]">{value}</h4>
        <p className="text-[10px] font-bold text-muted-foreground italic leading-tight">{subValue}</p>
      </div>
    </Card>
  );
}

function SpecLine({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 hover:bg-white/5 px-2 transition-colors rounded-lg cursor-default">
      <span className="text-xs font-bold uppercase tracking-widest opacity-60">{label}</span>
      <span className="text-sm font-black uppercase tracking-tight">{value}</span>
    </div>
  );
}
