import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TrendingUp, Activity, AlertTriangle, UserMinus, DollarSign, ArrowUpRight, Zap, Lightbulb } from 'lucide-react';

const PREDICTIVE_DATA = [
  { name: 'M-5', actual: 4000, predicted: 4200, risk: 2 },
  { name: 'M-4', actual: 4500, predicted: 4400, risk: 3 },
  { name: 'M-3', actual: 5100, predicted: 5000, risk: 4 },
  { name: 'M-2', actual: 4800, predicted: 5200, risk: 3 },
  { name: 'M-1', actual: 5400, predicted: 5600, risk: 5 },
  { name: 'Current', actual: 6000, predicted: 6200, risk: 7 },
  { name: 'Next', actual: null, predicted: 6800, risk: 6 },
  { name: 'Next+1', actual: null, predicted: 7200, risk: 5 },
];

export default function PredictiveAnalytics() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-[#F3F5F8] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Probabilité de Défaut Locataire (PDL)</CardTitle>
                <CardDescription className="text-xs font-bold uppercase opacity-60">Modélisation prédictive de la solvabilité à 12 mois</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Calcul Statistique Actif</span>
              </div>
            </CardHeader>
            <CardContent className="h-[400px] p-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PREDICTIVE_DATA}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                  />
                  <Area type="monotone" dataKey="actual" name="Données Réelles" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" />
                  <Area type="monotone" dataKey="predicted" name="Modélisation Mathématique" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPred)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PredictionDetailCard 
               icon={UserMinus} 
               label="Taux de Churn Calculé" 
               value="4.2%" 
               trend="-1.2%" 
               color="text-rose-500"
               description="Probabilité mathématique de départ locataire sur le prochain trimestre."
            />
            <PredictionDetailCard 
               icon={AlertTriangle} 
               label="Score d'Anomalie Statistique" 
               value="Bas" 
               trend="98.5" 
               color="text-emerald-500"
               description="Résidu de variance détecté dans les flux financiers."
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-[#1A1F36] text-white p-8">
            <div className="p-3 bg-primary w-fit rounded-2xl mb-6 shadow-xl shadow-primary/20">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight mb-4">Analyse Quantitative</h3>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest leading-relaxed mb-8">
              L'algorithme recommande les actions stratégiques suivantes basées sur les calculs :
            </p>
            <div className="space-y-4">
              <PrescriptionItem text="Ajuster la limite de crédit pour le Segment A (Retail)" impact="Haut" />
              <PrescriptionItem text="Lancer l'audit de solvabilité anticipé pour Immeuble B" impact="Moyen" />
              <PrescriptionItem text="Optimisation linéaire de l'allocation au Cluster Nord" impact="Haut" />
            </div>
            <Button className="w-full mt-10 bg-white text-primary hover:bg-white/90 rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-2xl shadow-black">
              Exécuter Calculs
            </Button>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white p-8 overflow-hidden relative group">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Précision Algorithmique</h4>
              <div className="flex items-center gap-6">
                <div className="text-5xl font-black text-[#1A1F36] transition-transform group-hover:scale-110">94<span className="text-primary italic">%</span></div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-tight">Indice de Corrélation</p>
                  <p className="text-[10px] font-bold text-muted-foreground opacity-60 leading-tight">Vérifié par régression linéaire sur 500 échantillons.</p>
                </div>
              </div>
              <div className="mt-8 flex gap-2">
                <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border-none">Précis</Badge>
                <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-widest bg-blue-50 text-blue-600 border-none">Calcul Matriciel</Badge>
              </div>
            </div>
            <Activity className="absolute -right-6 -bottom-6 w-32 h-32 opacity-5 text-primary rotate-12 group-hover:scale-125 transition-transform" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function PredictionDetailCard({ icon: Icon, label, value, trend, color, description }: any) {
  return (
    <Card className="rounded-3xl border-none shadow-xl shadow-black/5 bg-white p-6 group">
      <div className="flex justify-between items-start">
        <div className={`p-4 rounded-xl bg-muted/20 group-hover:bg-primary group-hover:text-white transition-all ${color}`}>
          <Icon className="w-5 h-5 shrink-0" />
        </div>
        <div className="flex items-center gap-1 font-black text-[10px] uppercase tracking-tighter text-emerald-600">
          <ArrowUpRight className="w-3 h-3" />
          {trend}
        </div>
      </div>
      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#697386]">{label}</p>
        <h4 className="text-3xl font-black uppercase tracking-tighter text-[#1A1F36] mt-1">{value}</h4>
        <p className="text-[10px] font-bold text-muted-foreground leading-tight mt-2">{description}</p>
      </div>
    </Card>
  );
}

function PrescriptionItem({ text, impact }: any) {
  return (
    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors cursor-pointer">
      <span className="text-[11px] font-black uppercase tracking-tight leading-tight max-w-[70%]">{text}</span>
      <Badge className={impact === 'High' ? 'bg-emerald-500 text-white' : 'bg-primary text-white' + ' font-black text-[8px] uppercase tracking-widest rounded-md px-2 py-0.5'}>
        {impact}
      </Badge>
    </div>
  );
}

import { Button } from '../../components/ui/button';
