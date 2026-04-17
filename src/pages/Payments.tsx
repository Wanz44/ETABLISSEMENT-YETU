import React, { useEffect, useState } from 'react';
import { Plus, CreditCard, Calendar, DollarSign, MoreVertical, Search, FileCheck, Wallet, Landmark, Download, Printer, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
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
      units: await dbLocal.units.toArray(),
      centers: await dbLocal.centers.toArray(),
    };
  }) || { payments: [], invoices: [], tenants: [], units: [], centers: [] };

  const { payments, invoices, tenants, units, centers } = data;
  
  const [searchTerm, setSearchTerm] = useState('');
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
      const serialNumber = `PAY-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const paymentId = await DataService.add('payments', {
        ...newPayment,
        tenantId: invoice.tenantId,
        date: paymentDate,
        serialNumber
      });

      // Update invoice amountPaid and status
      const newAmountPaid = invoice.amountPaid + newPayment.amount;
      const newStatus = newAmountPaid >= invoice.totalAmount ? 'paid' : 'partial';
      
      await DataService.update('invoices', invoice.id, {
        amountPaid: newAmountPaid,
        status: newStatus
      });

      setIsDialogOpen(false);
      toast.success('Paiement enregistré avec succès');

      // Automatically generate and download receipt
      const createdPayment = { 
        ...newPayment, 
        id: paymentId as string, 
        date: paymentDate, 
        tenantId: invoice.tenantId,
        serialNumber
      };
      generateReceipt(createdPayment as Payment);
      
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const generateReceipt = async (payment: Payment) => {
    const tenant = tenants.find(t => t.id === payment.tenantId);
    const invoice = invoices.find(i => i.id === payment.invoiceId);
    const unit = units.find(u => u.id === (invoice?.unitId || ''));
    const center = centers.find(c => c.id === (unit?.centerId || ''));

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text('REÇU DE PAIEMENT', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('YETU Gestion Immobilière', 20, 30);
    doc.text('Paiement Local Sécurisé', 20, 35);

    // QR Code Integration
    const qrText = `YETU_PAYMENT_VERIFICATION\nS/N: ${payment.serialNumber}\nLocataire: ${tenant?.name}\nMontant: ${payment.amount} ${payment.currency}\nDate: ${format(new Date(payment.date), 'dd/MM/yyyy')}`;
    const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 200 });
    doc.addImage(qrDataUrl, 'PNG', 160, 10, 35, 35);

    // Separator
    doc.setDrawColor(200);
    doc.line(20, 40, 190, 40);

    // Payment Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`S/N: ${payment.serialNumber || 'N/A'}`, 20, 50);
    doc.setFont('helvetica', 'normal');
    const formattedDate = format(new Date(payment.date), 'dd/MM/yyyy HH:mm');
    doc.text(`Date: ${formattedDate}`, 110, 50);

    // Details Grid
    autoTable(doc, {
      startY: 60,
      head: [['Détails du Paiement', 'Informations']],
      body: [
        ['Réf. Système', String(payment.id).slice(0, 8).toUpperCase()],
        ['Locataire', tenant?.name || 'Inconnu'],
        ['Entreprise', tenant?.company || 'N/A'],
        ['Unité / Centre', `${unit?.name || 'N/A'} - ${center?.name || 'N/A'}`],
        ['Facture Réf.', invoice?.invoiceNumber || 'N/A'],
        ['Méthode', payment.method.replace('_', ' ').toUpperCase()],
        ['Référence Client', payment.reference || 'N/A'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { cellPadding: 5 }
    });

    // Amount Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setDrawColor(41, 128, 185);
    doc.setFillColor(240, 248, 255);
    doc.rect(120, finalY, 70, 20, 'FD');
    
    doc.setFontSize(10);
    doc.text('MONTANT PAYÉ', 125, finalY + 7);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${payment.amount.toLocaleString()} ${payment.currency}`, 125, finalY + 16);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    const footerY = 280;
    doc.text('Ce document est un reçu officiel généré électroniquement par le système YETU.', 105, footerY, { align: 'center' });
    
    doc.save(`Recu_${tenant?.name || 'Client'}_${String(payment.id).slice(0, 8)}.pdf`);
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

  const exportToExcel = () => {
    const dataToExport = payments.map(p => {
      const tenant = tenants.find(t => t.id === p.tenantId);
      return {
        'S/N': p.serialNumber,
        'Date': format(new Date(p.date), 'dd/MM/yyyy HH:mm'),
        'Locataire': tenant?.name,
        'Montant': p.amount,
        'Devise': p.currency,
        'Méthode': p.method.replace('_', ' ').toUpperCase(),
        'Référence': p.reference
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Paiements');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, `Paiements_Yetu_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
    toast.success('Export Excel terminé');
  };

  const stats = getStats();

  const filteredPayments = payments.filter((payment) => {
    const tenant = tenants.find((t) => t.id === payment.tenantId);
    const tenantName = tenant?.name?.toLowerCase() || '';
    const reference = payment.reference?.toLowerCase() || '';
    const serial = payment.serialNumber?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();

    return tenantName.includes(term) || reference.includes(term) || serial.includes(term);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Paiements</h2>
          <p className="text-muted-foreground">Suivi des encaissements et génération de reçus.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} className="rounded-xl border-emerald-200 hover:bg-emerald-50 text-emerald-700">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button className="rounded-xl">
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
        <Card className="p-2 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par locataire ou référence..." 
              className="pl-9 rounded-xl border-none shadow-none bg-muted/50 focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

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
            {filteredPayments.map((payment) => {
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
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px]">{payment.serialNumber || '-'}</span>
                      <span>{payment.reference || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-600">
                    + {payment.amount.toLocaleString()} {payment.currency || 'USD'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-primary hover:bg-primary/10"
                        onClick={() => generateReceipt(payment)}
                        title="Télécharger le reçu PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <FileCheck className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <CreditCard className="w-12 h-12 mb-4 opacity-20" />
                    <p>{searchTerm ? 'Aucun résultat correspondant à votre recherche.' : 'Aucun paiement enregistré.'}</p>
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
