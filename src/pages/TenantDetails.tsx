import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Receipt, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  TrendingDown, 
  History,
  DollarSign,
  Calendar
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../lib/db';
import { Tenant, Invoice, Payment, Unit } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TenantDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const tenant = useLiveQuery(() => id ? dbLocal.tenants.get(id) : Promise.resolve(null), [id]);
  const invoices = useLiveQuery(() => id ? dbLocal.invoices.where('tenantId').equals(id).reverse().sortBy('year').then(data => data.sort((a, b) => b.year - a.year || b.month - a.month)) : Promise.resolve([]), [id]) || [];
  const payments = useLiveQuery(() => id ? dbLocal.payments.where('tenantId').equals(id).reverse().sortBy('date') : Promise.resolve([]), [id]) || [];
  const units = useLiveQuery(() => dbLocal.units.toArray()) || [];

  if (!tenant) return null;

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalDebt = totalBilled - totalPaid;

  const now = new Date();
  const overdueInvoices = invoices.filter(inv => 
    inv.status !== 'paid' && 
    new Date(inv.dueDate) < now
  );
  
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');

  const overdueAmount = overdueInvoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.amountPaid), 0);
  const totalUnpaidAmount = unpaidInvoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.amountPaid), 0);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">
            {tenant.legalStatus === 'company' ? tenant.company : tenant.name}
          </h2>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-60">
            {tenant.legalStatus === 'company' ? `Mandataire / Gérant: ${tenant.name}` : 'Dossier Locatire Particulier'} • Situation Financière
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-3xl border-none shadow-xl shadow-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Total Facturé</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground opacity-30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tighter">{totalBilled.toLocaleString()} <span className="text-xs font-normal opacity-50">$</span></div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-xl shadow-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-emerald-600 tracking-widest italic">Total Encaissé</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-600 opacity-30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tighter text-emerald-600">{totalPaid.toLocaleString()} <span className="text-xs font-normal opacity-50">$</span></div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-xl shadow-black/5 bg-amber-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-amber-700 tracking-widest italic">Factures Impayées</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-700 opacity-30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tighter text-amber-700">{totalUnpaidAmount.toLocaleString()} <span className="text-xs font-normal opacity-50">$</span></div>
            <p className="text-[9px] font-black uppercase opacity-60 mt-1">{unpaidInvoices.length} Titres en attente</p>
          </CardContent>
        </Card>

        <Card className={cn("rounded-3xl border-none shadow-xl shadow-black/5", overdueAmount > 0 ? "bg-destructive/10 text-destructive ring-2 ring-destructive/20" : "")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest italic">Dettes Échues</CardTitle>
            <AlertCircle className={cn("h-4 w-4 opacity-30", overdueAmount > 0 ? "text-destructive" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter">
              {overdueAmount.toLocaleString()} <span className="text-xs font-normal opacity-50">$</span>
            </div>
            {overdueAmount > 0 && (
              <p className="text-[9px] font-black uppercase mt-1 animate-pulse">
                Action Juridique / Recouvrement requis
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {overdueInvoices.length > 0 && (
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-destructive/5 text-destructive p-8">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-black tracking-tighter uppercase">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center animate-bounce">
                <AlertCircle className="w-6 h-6" />
              </div>
              Factures en Souffrance (Échues)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3">
              {overdueInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur rounded-2xl border border-destructive/20">
                  <div>
                    <p className="font-black text-sm uppercase">{months[inv.month - 1]} {inv.year}</p>
                    <p className="text-[10px] uppercase font-bold opacity-60">Échu le : {format(new Date(inv.dueDate), 'dd MMMM yyyy', { locale: fr })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg tracking-tighter">{(inv.totalAmount - inv.amountPaid).toLocaleString()} $</p>
                    <Badge variant="destructive" className="text-[8px] h-4 uppercase font-black tracking-tight leading-none">
                      Retard de {Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))} jours
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Historique des Factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {months[inv.month - 1]} {inv.year}
                    </TableCell>
                    <TableCell>
                      {inv.totalAmount.toLocaleString()} $
                      <div className="text-[10px] text-muted-foreground">
                        Loyer: {inv.amountRent}$ | Eau: {inv.amountWater}$ | Élec: {inv.amountElectricity}$
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        inv.status === 'paid' ? 'default' : 
                        inv.status === 'partial' ? 'secondary' : 'destructive'
                      }>
                        {inv.status === 'paid' ? 'Payée' : 
                         inv.status === 'partial' ? 'Partielle' : 'Impayée'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Aucune facture trouvée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historique des Paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {format(new Date(p.date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      + {p.amount.toLocaleString()} $
                    </TableCell>
                    <TableCell className="capitalize text-xs">
                      {p.method.replace('_', ' ')}
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Aucun paiement enregistré.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
