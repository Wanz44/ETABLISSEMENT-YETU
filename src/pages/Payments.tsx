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
import { cn } from '../lib/utils';
import { Payment, Invoice, Tenant } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';

export default function Payments() {
  const data = useLiveQuery(async () => {
    return {
      payments: await dbLocal.payments.toArray(),
      invoices: await dbLocal.invoices.toArray(),
      tenants: await dbLocal.tenants.toArray(),
      units: await dbLocal.units.toArray(),
      centers: await dbLocal.centers.toArray(),
      contracts: await dbLocal.contracts.toArray(),
    };
  }) || { payments: [], invoices: [], tenants: [], units: [], centers: [], contracts: [] };

  const { payments, invoices, tenants, units, centers, contracts } = data;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  
  const [newPayment, setNewPayment] = useState({
    invoiceId: '',
    amount: 0,
    currency: 'USD' as const,
    method: 'cash' as 'cash' | 'mobile_money' | 'bank',
    reference: '',
    phoneNumber: '',
    bankName: ''
  });

  const handleToggleMonth = async (monthIndex: number, isPaid: boolean) => {
    if (!selectedTenantId) return;

    const month = monthIndex + 1;
    const existingInvoice = invoices.find(i => 
      i.tenantId === selectedTenantId && 
      i.month === month && 
      i.year === viewYear
    );

    const activeContract = contracts.find(c => 
      c.tenantId === selectedTenantId && 
      c.status === 'active'
    );

    if (!isPaid) {
      // Logic to unpay: Mark invoice as unpaid and remove last payment record tied to it
      if (existingInvoice) {
        await DataService.update('invoices', existingInvoice.id, {
          amountPaid: 0,
          status: 'unpaid'
        });
        
        // Find payments linked to this invoice and remove them
        const relatedPayments = payments.filter(p => p.invoiceId === existingInvoice.id);
        for (const p of relatedPayments) {
          await dbLocal.payments.delete(p.id);
        }
        
        toast.info(`Mois de ${months[monthIndex]} marqué comme impayé`);
      }
    } else {
      // Logic to pay
      let currentInvoice = existingInvoice;
      
      if (!currentInvoice) {
        if (!activeContract) {
          toast.error("Aucun contrat actif trouvé pour ce locataire");
          return;
        }

        const invNumber = `INV-${Date.now().toString().slice(-6)}`;
        const invoiceId = await DataService.add('invoices', {
          invoiceNumber: invNumber,
          invoiceCode: invNumber,
          contractId: activeContract.id,
          tenantId: selectedTenantId,
          unitId: activeContract.unitId,
          month,
          year: viewYear,
          amountRent: activeContract.rentAmount,
          amountWater: 0,
          amountElectricity: 0,
          totalAmount: activeContract.rentAmount,
          amountPaid: activeContract.rentAmount,
          currency: activeContract.currency,
          status: 'paid',
          dueDate: format(new Date(viewYear, month - 1, 5), 'yyyy-MM-dd'),
          createdAt: new Date().toISOString()
        });
        
        // Load the new invoice
        currentInvoice = (await dbLocal.invoices.get(invoiceId as string)) as Invoice;
      } else {
        await DataService.update('invoices', currentInvoice.id, {
          amountPaid: currentInvoice.totalAmount,
          status: 'paid'
        });
      }

      // Create Payment Record
      const serialNumber = `PAY-${Date.now().toString().slice(-8)}`;
      await DataService.add('payments', {
        invoiceId: currentInvoice?.id || '',
        tenantId: selectedTenantId,
        amount: currentInvoice?.totalAmount || 0,
        currency: currentInvoice?.currency || 'USD',
        date: new Date().toISOString(),
        method: 'cash',
        reference: `Suivi Mensuel ${months[monthIndex]} ${viewYear}`,
        serialNumber
      });

      toast.success(`Mois de ${months[monthIndex]} payé`);
    }
  };

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
        ...(payment.method === 'mobile_money' ? [['N° Téléphone', payment.phoneNumber || 'N/A']] as any : []),
        ...(payment.method === 'bank' ? [['Banque', payment.bankName || 'N/A']] as any : []),
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
    const dataToExport = filteredPayments.map(p => {
      const tenant = tenants.find(t => t.id === p.tenantId);
      const invoice = invoices.find(i => i.id === p.invoiceId);
      
      return {
        'S/N Paiement': p.serialNumber,
        'Date': format(new Date(p.date), 'dd/MM/yyyy HH:mm'),
        'Locataire': tenant?.name || 'N/A',
        'Entreprise': tenant?.company || 'N/A',
        'Montant': p.amount,
        'Devise': p.currency,
        'Méthode': p.method.replace('_', ' ').toUpperCase(),
        'Référence': p.reference || '-',
        'N° Facture': invoice?.invoiceNumber || '-',
        'Période Facturée': invoice ? `${months[invoice.month - 1]} ${invoice.year}` : '-'
      };
    });

    // Summary sheet data
    const summaryData = [
      { 'Catégorie': 'Total Encaissé USD', 'Valeur': stats.usdTotal },
      { 'Catégorie': 'Total Encaissé CDF', 'Valeur': stats.cdfTotal },
      { 'Catégorie': 'Nombre de paiements', 'Valeur': payments.length },
      { 'Catégorie': 'Taux d\'occupation', 'Valeur': (units.filter(u => u.status === 'occupied').length / units.length * 100).toFixed(1) + '%' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Détails Paiements');
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé Financier');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, `Rapport_Paiements_Yetu_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
    toast.success(`${filteredPayments.length} paiements exportés dans un rapport complet.`);
  };

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Encaissements</h2>
          <p className="text-muted-foreground font-medium">Suivi financier et historique des règlements.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportToExcel} className="rounded-xl border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exporter Rapport
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button className="rounded-xl font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Paiement Manuel
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Enregistrer un Paiement Spécifique</DialogTitle>
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
                            {t?.name} - {remaining} {i.currency} restant ({months[i.month-1]})
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
                    <Label htmlFor="ref">Référence / Identifiant Transaction</Label>
                    <Input 
                      id="ref" 
                      value={newPayment.reference}
                      onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})}
                      placeholder={
                        newPayment.method === 'mobile_money' ? 'ex: PP2203...' : 
                        newPayment.method === 'bank' ? 'ex: BORD-001...' : 'N° Reçu manuel'
                      }
                    />
                  </div>

                  {newPayment.method === 'mobile_money' && (
                    <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Label htmlFor="phone">Numéro de téléphone payeur</Label>
                      <Input 
                        id="phone" 
                        value={newPayment.phoneNumber}
                        onChange={(e) => setNewPayment({...newPayment, phoneNumber: e.target.value})}
                        placeholder="ex: +243..."
                      />
                    </div>
                  )}

                  {newPayment.method === 'bank' && (
                    <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Label htmlFor="bank">Nom de la banque / Agence</Label>
                      <Input 
                        id="bank" 
                        value={newPayment.bankName}
                        onChange={(e) => setNewPayment({...newPayment, bankName: e.target.value})}
                        placeholder="ex: Equity BCDC..."
                      />
                    </div>
                  )}
                </div>
              <DialogFooter>
                <Button onClick={handleAddPayment}>Confirmer le paiement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="grid" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-12 w-full max-w-md">
          <TabsTrigger value="grid" className="flex-1 rounded-xl font-bold py-2">Suivi Mensuel (Grille)</TabsTrigger>
          <TabsTrigger value="list" className="flex-1 rounded-xl font-bold py-2">Historique Détaillé</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6 animate-in fade-in duration-300">
          <Card className="rounded-[2rem] p-8 border-none shadow-xl shadow-foreground/5 bg-card">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-1 max-w-md">
                <Label className="mb-2 block text-sm font-bold">Sélectionner un Locataire</Label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Choisir un locataire..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name} ({t.company})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-40">
                <Label className="mb-2 block text-sm font-bold">Année</Label>
                <Select value={String(viewYear)} onValueChange={(val) => setViewYear(Number(val))}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {selectedTenantId ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {months.map((monthName, idx) => {
                    const invoice = invoices.find(i => 
                      i.tenantId === selectedTenantId && 
                      i.month === idx + 1 && 
                      i.year === viewYear
                    );
                    const isPaid = invoice?.status === 'paid';
                    
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "relative p-5 rounded-3xl border-2 transition-all cursor-pointer group flex flex-col justify-between h-32",
                          isPaid 
                            ? "bg-emerald-50/50 border-emerald-500/20 text-emerald-900 shadow-sm" 
                            : "bg-muted/30 border-transparent hover:bg-muted/50 text-muted-foreground"
                        )}
                        onClick={() => handleToggleMonth(idx, !isPaid)}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-black text-sm uppercase tracking-wider">{monthName}</span>
                          <Checkbox 
                            checked={isPaid} 
                            onCheckedChange={() => {}} // Handle click on container instead
                            className={cn(
                              "w-6 h-6 rounded-lg",
                              isPaid ? "bg-emerald-500 border-emerald-500 text-white" : ""
                            )}
                          />
                        </div>
                        <div className="flex items-end justify-between">
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                            isPaid ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                          )}>
                            {isPaid ? "Payé" : "À Payer"}
                          </div>
                          {isPaid && (
                            <span className="text-xs font-bold opacity-60">
                              {invoice.totalAmount} {invoice.currency}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground font-medium italic">Sélectionnez un locataire pour afficher sa grille de suivi annuel.</p>
                </div>
              )}
            </AnimatePresence>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-3xl border-none shadow-md bg-card p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Encaissé (USD)</p>
              <div className="text-3xl font-black text-primary">
                {stats.usdTotal.toLocaleString()} <span className="text-sm">USD</span>
              </div>
            </Card>
            <Card className="rounded-3xl border-none shadow-md bg-card p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Encaissé (CDF)</p>
              <div className="text-3xl font-black text-primary">
                {stats.cdfTotal.toLocaleString()} <span className="text-sm">CDF</span>
              </div>
            </Card>
            <Card className="rounded-3xl border-none shadow-md bg-card p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Paiements ce mois</p>
              <div className="text-3xl font-black text-primary">
                {payments.filter(p => new Date(p.date).getMonth() === new Date().getMonth()).length}
              </div>
            </Card>
          </div>

          <Card className="rounded-[2rem] border-none shadow-xl shadow-foreground/5 bg-card overflow-hidden">
            <div className="p-6 bg-muted/30 border-b flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher par locataire, référence ou reçu..." 
                  className="pl-9 h-11 rounded-xl border-none shadow-none bg-muted/50 focus-visible:ring-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Locataire</TableHead>
                  <TableHead className="font-bold">Méthode</TableHead>
                  <TableHead className="font-bold">Référence</TableHead>
                  <TableHead className="font-bold">Montant</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const tenant = tenants.find(t => t.id === payment.tenantId);
                  
                  return (
                    <TableRow key={payment.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="text-sm font-medium">
                        {format(new Date(payment.date), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-foreground">{tenant?.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">{tenant?.company}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 capitalize text-sm font-medium">
                          <div className="p-2 bg-muted rounded-lg">
                            {getMethodIcon(payment.method)}
                          </div>
                          {payment.method.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md w-fit mb-1">{payment.serialNumber || '-'}</span>
                          <span className="text-xs text-muted-foreground font-medium italic">{payment.reference || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-emerald-600 text-lg">
                        + {payment.amount.toLocaleString()} <span className="text-xs">{payment.currency || 'USD'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-10 h-10 rounded-xl text-primary hover:bg-primary/10 transition-all hover:scale-110 shadow-sm"
                            onClick={() => generateReceipt(payment)}
                            title="Télécharger le reçu PDF"
                          >
                            <Download className="w-5 h-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <CreditCard className="w-16 h-16 mb-4 opacity-10" />
                        <p className="font-bold text-lg">{searchTerm ? 'Aucun résultat trouvé.' : 'Votre historique est vide.'}</p>
                        <p className="text-sm italic opacity-70">Utilisez la grille de suivi pour enregistrer des paiements.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
