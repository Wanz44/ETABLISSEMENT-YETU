import React, { useEffect, useState } from 'react';
import { Plus, CreditCard, Calendar, DollarSign, MoreVertical, Search, FileCheck, Wallet, Landmark } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../lib/db';
import { DataService } from '../lib/data';
import { Payment, Invoice, Tenant } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Payments() {
  const data = useLiveQuery(async () => {
    return {
      payments: await dbLocal.payments.toArray(),
      invoices: await dbLocal.invoices.toArray(),
      tenants: await dbLocal.tenants.toArray(),
    };
  }) || { payments: [], invoices: [], tenants: [] };

  const { payments, invoices, tenants } = data;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    invoiceId: '',
    amount: 0,
    currency: 'USD' as const,
    method: 'cash' as const,
    reference: ''
  });

  const handleAddPayment = async () => {
    const invoice = invoices.find(i => i.id === newPayment.invoiceId);
    if (!invoice || !newPayment.amount) return;

    try {
      const paymentDate = new Date().toISOString();
      await DataService.add('payments', {
        ...newPayment,
        tenantId: invoice.tenantId,
        date: paymentDate
      });

      // Update invoice amountPaid and status
      const newAmountPaid = invoice.amountPaid + newPayment.amount;
      const newStatus = newAmountPaid >= invoice.totalAmount ? 'paid' : 'partial';
      
      await DataService.update('invoices', invoice.id, {
        amountPaid: newAmountPaid,
        status: newStatus
      });

      setIsDialogOpen(false);
      toast.success('Paiement enregistré avec succès (Local-First)');
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Wallet className="w-4 h-4" />;
      case 'mobile_money': return <Landmark className="w-4 h-4" />;
      case 'bank': return <Landmark className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStats = () => {
    const usdTotal = payments
      .filter(p => (p.currency || 'USD') === 'USD')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const cdfTotal = payments
      .filter(p => p.currency === 'CDF')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    return { usdTotal, cdfTotal };
  };

  const stats = getStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Paiements</h2>
          <p className="text-muted-foreground">Suivi des encaissements et génération de reçus.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Paiement
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Enregistrer un Paiement</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label>Facture Impayée</Label>
                <Select onValueChange={(val) => {
                  const inv = invoices.find(i => i.id === val);
                  setNewPayment({
                    ...newPayment, 
                    invoiceId: val,
                    currency: (inv?.currency as any) || 'USD',
                    amount: (inv?.totalAmount || 0) - (inv?.amountPaid || 0)
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une facture" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.filter(i => i.status !== 'paid').map(i => {
                      const t = tenants.find(tenant => tenant.id === i.tenantId);
                      const remaining = i.totalAmount - i.amountPaid;
                      return (
                        <SelectItem key={i.id} value={i.id}>
                          {t?.name} - {remaining} {i.currency} restant
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Montant</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="amount" 
                      type="number" 
                      className="flex-1"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})}
                    />
                    <Select value={newPayment.currency} onValueChange={(val: any) => setNewPayment({...newPayment, currency: val})}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CDF">CDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Méthode</Label>
                  <Select defaultValue="cash" onValueChange={(val: any) => setNewPayment({...newPayment, method: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Espèces (Cash)</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank">Virement Bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ref">Référence / N° Reçu</Label>
                <Input 
                  id="ref" 
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})}
                  placeholder="ex: M-PESA Ref, N° Bordereau..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPayment}>Confirmer le paiement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Encaissé (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.usdTotal.toLocaleString()} USD
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Encaissé (CDF)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.cdfTotal.toLocaleString()} CDF
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paiements ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.filter(p => new Date(p.date).getMonth() === new Date().getMonth()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Locataire</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const tenant = tenants.find(t => t.id === payment.tenantId);
              
              return (
                <TableRow key={payment.id}>
                  <TableCell className="text-sm">
                    {format(new Date(payment.date), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{tenant?.name}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 capitalize text-sm">
                      {getMethodIcon(payment.method)}
                      {payment.method.replace('_', ' ')}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.reference || '-'}
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-600">
                    + {payment.amount.toLocaleString()} {payment.currency || 'USD'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <FileCheck className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <CreditCard className="w-12 h-12 mb-4 opacity-20" />
                    <p>Aucun paiement enregistré.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
