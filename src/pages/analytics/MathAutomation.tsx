import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Cpu, Zap, UserCheck, Calculator, Terminal, Rocket, Infinity, Sigma, Binary, Settings2 } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function MathAutomation() {
  const algorithms = [
    { name: 'Algorithme Scoring Beta', type: 'Modèle Statistique', efficiency: '99.8%', status: 'Stable', icon: Calculator },
    { name: 'Détecteur d\'Anomalies Math', type: 'Écart-Type Relatif', efficiency: '94.2%', status: 'Stable', icon: Sigma },
    { name: 'Optimiseur de Flux', type: 'Recherche Opérationnelle', efficiency: '88.5%', status: 'Actif', icon: Binary },
    { name: 'Automatisation RPA Script', type: 'Scripting Déterministe', efficiency: '100%', status: 'Stable', icon: Terminal },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
          <Settings2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[#1A1F36]">Algorithmes & Automatisation Déterministe</h2>
          <p className="text-xs font-bold uppercase text-muted-foreground opacity-60 tracking-widest italic">Déploiement de méthodes numériques & RPA Bancaire</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {algorithms.map((algo, i) => (
            <Card key={i} className="rounded-[2rem] border-none shadow-xl shadow-black/5 bg-white p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
               <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                   <div className="p-4 rounded-2xl bg-muted/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                     <algo.icon className="w-5 h-5" />
                   </div>
                   <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest">{algo.status}</Badge>
                 </div>
                 <h4 className="text-lg font-black uppercase tracking-tighter text-[#1A1F36] leading-tight">{algo.name}</h4>
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{algo.type}</p>
                 <div className="mt-8 flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#697386]">Précision de Calcul</p>
                      <p className="text-2xl font-black text-primary">{algo.efficiency}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest rounded-lg underline-offset-4 hover:underline">Vérifier Math</Button>
                 </div>
               </div>
            </Card>
          ))}
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-[#1A1F36] text-white p-8 overflow-hidden relative">
           <Infinity className="absolute -right-20 -top-20 w-80 h-80 opacity-5 rotate-45" />
           <div className="relative z-10 flex flex-col h-full">
             <div className="mb-10">
                <Badge className="bg-primary/20 text-primary border border-primary/30 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Numerical Computing</Badge>
                <h3 className="text-3xl font-black uppercase tracking-tighter leading-none italic mb-4">Pipeline Quant<br />Temps Réel</h3>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed">Traitement par calcul matriciel sur flux de données transactionnelles.</p>
             </div>
             
             <div className="space-y-6 flex-1">
                <div className="p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">Calculs en Parallèle</p>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-xs font-bold">4.2 Gflops</span>
                      <span className="text-[9px] font-black italic opacity-50">Stable</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4 opacity-50">
                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                   <div className="flex-1 text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest">Quant Node Logic</p>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-xs font-bold">Algorithme Linéaire</span>
                      <span className="text-[9px] font-black italic">Actif</span>
                    </div>
                  </div>
                </div>
             </div>

             <Button className="w-full mt-10 bg-primary text-white hover:bg-primary/90 rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-2xl shadow-black">
               Mettre à jour Scripts
             </Button>
           </div>
        </Card>
      </div>
    </div>
  );
}
