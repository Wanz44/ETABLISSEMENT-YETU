import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ShieldCheck, Lock, FileCheck, Search, Users, ExternalLink, AlertTriangle, CheckCircle2, Fingerprint } from 'lucide-react';

export default function DataGovernance() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white overflow-hidden">
          <CardHeader className="bg-muted/10 p-8 border-b border-[#F3F5F8] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tighter">Master Data Management (MDM)</CardTitle>
              <CardDescription className="text-xs font-bold uppercase opacity-60">Référentiel unique et gouvernance de la donnée client</CardDescription>
            </div>
            <ShieldCheck className="w-8 h-8 text-primary opacity-50" />
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Politiques d'Accès & Sécurité</h4>
                <div className="space-y-4">
                  <PolicyItem icon={Lock} label="Anonymisation RGPD" status="Activé" description="Masquage automatique des données PII par défaut." />
                  <PolicyItem icon={Fingerprint} label="Chiffrement au repos" status="AES-256" description="Clés de chiffrement gérées via HSM matériel." />
                  <PolicyItem icon={ShieldCheck} label="Audit Data Lineage" status="Conforme" description="Tracé complet des données du lac vers le BI." />
                </div>
              </div>
              <div className="bg-[#F8F9FA] rounded-[2rem] p-6 border-2 border-dashed border-[#E1E5EB] flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A1F36] mb-4">Indicateurs Qualité (Data Quality)</h4>
                  <div className="space-y-4">
                    <QualityIndicator label="Complétude" value={98.4} color="bg-emerald-500" />
                    <QualityIndicator label="Précision" value={99.2} color="bg-blue-500" />
                    <QualityIndicator label="Consistance" value={97.8} color="bg-amber-500" />
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">3 alertes de doublons détectées</span>
                  </div>
                  <Button className="w-full text-[10px] font-black uppercase tracking-widest h-10 rounded-xl bg-[#1A1F36] text-white">Lancer Nettoyage Automatique</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/20" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1F36] mb-4">Conformité<br />Réglementaire</h3>
            <div className="space-y-3">
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] uppercase tracking-widest flex items-center gap-2 py-1.5 px-3 w-fit">
                <CheckCircle2 className="w-3 h-3" /> RGPD Certifié
              </Badge>
              <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] uppercase tracking-widest flex items-center gap-2 py-1.5 px-3 w-fit">
                <CheckCircle2 className="w-3 h-3" /> PCI-DSS Level 1
              </Badge>
              <Badge className="bg-amber-50 text-amber-600 border-none font-black text-[10px] uppercase tracking-widest flex items-center gap-2 py-1.5 px-3 w-fit">
                <CheckCircle2 className="w-3 h-3" /> AML5 Compliance
              </Badge>
            </div>
            <div className="mt-8 space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wider">
                Le système de gouvernance assure une traçabilité complète de chaque transaction, garantissant que les audits réglementaires peuvent être menés en temps réel avec une intégrité prouvée.
              </p>
              <Button variant="outline" className="w-full rounded-xl h-12 border-2 font-black uppercase text-[10px] tracking-widest bg-[#F8F9FA]">Consulter Data Catalog</Button>
            </div>
          </Card>

           <Card className="rounded-[2rem] bg-[#1A1F36] text-white p-6 border-none shadow-xl">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-primary rounded-lg">
                 <Search className="w-4 h-4" />
               </div>
               <span className="text-xs font-black uppercase tracking-widest">Recherche Traceur Lineage</span>
             </div>
             <p className="text-[10px] font-bold text-white/50 mb-6 uppercase">Entrez une ID de transaction pour voir son parcours architectural</p>
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="TX-ID-999382-A"
                  className="w-full h-12 rounded-xl bg-white/10 border-none px-4 text-sm font-bold uppercase placeholder:text-white/20 focus:ring-2 ring-primary transition-all"
                />
                <Button size="icon" className="absolute right-1 top-1 h-10 w-10 rounded-lg bg-primary">
                  <ExternalLink className="w-4 h-4" />
                </Button>
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

function PolicyItem({ icon: Icon, label, status, description }: any) {
  return (
    <div className="flex gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-white shadow-sm border flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-tight">{label}</span>
          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md uppercase tracking-widest">{status}</span>
        </div>
        <p className="text-[10px] text-muted-foreground font-bold leading-tight mt-1">{description}</p>
      </div>
    </div>
  );
}

function QualityIndicator({ label, value, color }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] font-black uppercase text-[#697386]">{label}</span>
        <span className="text-xs font-black italic">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000`} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
}
