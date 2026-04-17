import React, { useEffect, useState } from 'react';
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
          <h2 className="text-3xl font-bold tracking-tight">{tenant.name}</h2>
          <p className="text-muted-foreground">{tenant.company} • Historique & Dettes</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturé</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBilled.toLocaleString()} $</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payé</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalPaid.toLocaleString()} $</div>
          </CardContent>
        </Card>
        <Card className={totalDebt > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dette Actuelle</CardTitle>
            <TrendingDown className={`h-4 w-4 ${totalDebt > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalDebt > 0 ? "text-destructive" : "text-emerald-600"}`}>
              {totalDebt.toLocaleString()} $
            </div>
            {totalDebt > 0 && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Paiement requis
              </p>
            )}
          </CardContent>
        </Card>
      </div>

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
