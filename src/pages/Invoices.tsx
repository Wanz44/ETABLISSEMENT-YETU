import React, { useEffect, useState } from 'react';
import { Plus, Receipt, Calendar, DollarSign, MoreVertical, Download, Send, AlertCircle, CheckCircle2, Eye, Edit } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../lib/db';
import { DataService } from '../lib/data';
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { Invoice, Contract, Tenant, Unit } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Printer, FileSpreadsheet, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ConfirmDialog } from '../components/ConfirmDialog';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Invoices() {
  const data = useLiveQuery(async () => {
    return {
      invoices: await dbLocal.invoices.toArray(),
      contracts: await dbLocal.contracts.toArray(),
      tenants: await dbLocal.tenants.toArray(),
      units: await dbLocal.units.toArray(),
      centers: await dbLocal.centers.toArray(),
    };
  }) || { invoices: [], contracts: [], tenants: [], units: [], centers: [] };

  const { invoices, contracts, tenants, units, centers } = data;
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'bank'>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentBank, setPaymentBank] = useState('');

  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);

  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isPrintConfirmOpen, setIsPrintConfirmOpen] = useState(false);
  const [bulkConfig, setBulkConfig] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    dueDate: format(new Date(), 'yyyy-MM-dd')
  });

  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const exportToExcel = () => {
    const dataToExport = invoices.map(inv => {
      const tenant = tenants.find(t => t.id === inv.tenantId);
      const unit = units.find(u => u.id === inv.unitId);
      return {
        'N° Facture': inv.invoiceNumber,
        'Code': inv.invoiceCode,
        'Locataire': tenant?.name,
        'Unité': unit?.name,
        'Période': `${months[inv.month - 1]} ${inv.year}`,
        'Loyer': inv.amountRent,
        'Eau': inv.amountWater,
        'Élec': inv.amountElectricity,
        'Total': inv.totalAmount,
        'Payé': inv.amountPaid,
        'Statut': inv.status.toUpperCase(),
        'Devise': inv.currency
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Factures');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, `Factures_Grace_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
    toast.success('Export Excel terminé');
  };

  const handleBulkGenerate = async () => {
    try {
      const activeContracts = contracts.filter(c => c.status === 'active');
      let generatedCount = 0;
      let skippedCount = 0;

      for (const contract of activeContracts) {
        const existing = await dbLocal.invoices
          .where({ 
            contractId: contract.id, 
            month: bulkConfig.month, 
            year: bulkConfig.year 
          })
          .first();

        if (existing) {
          skippedCount++;
          continue;
        }

        const totalAmount = contract.rentAmount;
        const invoiceNumber = `INV-${bulkConfig.year}${bulkConfig.month.toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const invoiceCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        await DataService.add('invoices', {
          contractId: contract.id,
          month: bulkConfig.month,
          year: bulkConfig.year,
          amountWater: 0,
          amountElectricity: 0,
          dueDate: bulkConfig.dueDate,
          invoiceNumber,
          invoiceCode,
          tenantId: contract.tenantId,
          unitId: contract.unitId,
          amountRent: contract.rentAmount,
          totalAmount,
          amountPaid: 0,
          currency: contract.currency || 'USD',
          status: 'unpaid',
          createdAt: new Date().toISOString()
        });
        generatedCount++;
      }

      setIsBulkDialogOpen(false);
      toast.success(`${generatedCount} factures générées, ${skippedCount} ignorées (déjà existantes).`);
      
      if (generatedCount > 0) {
        await DataService.add('notifications', {
          title: 'Facturation Groupée Terminée',
          message: `${generatedCount} factures ont été générées automatiquement pour le mois de ${months[bulkConfig.month - 1]}.`,
          type: 'success',
          date: new Date().toISOString(),
          read: false
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération groupée');
    }
  };

  const handlePrint = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPrintConfirmOpen(true);
  };

  const confirmPrint = () => {
    if (!selectedInvoice) return;
    generateInvoicePDF(selectedInvoice);
    setIsPrintConfirmOpen(false);
  };

  const generateInvoicePDF = (invoice: Invoice) => {
    const tenant = tenants.find(t => t.id === invoice.tenantId);
    const unit = units.find(u => u.id === invoice.unitId);
    const center = centers.find(c => c.id === unit?.centerId);
    const contract = contracts.find(c => c.id === invoice.contractId);

    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [26, 31, 54]; // #1A1F36
    
    // Header background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Brand
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('GRACE BANK - GESTION', 20, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Département d\'Administration Immobilière', 20, 32);
    
    // Invoice Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', 190, 25, { align: 'right' });
    doc.setFontSize(10);
    doc.text(invoice.invoiceNumber || `REF: ${String(invoice.id).slice(0, 8).toUpperCase()}`, 190, 32, { align: 'right' });

    // Info Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Column 1: From
    doc.setFont('helvetica', 'bold');
    doc.text('ÉMETTEUR:', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.text('Établissement GRACE', 20, 65);
    doc.text('Direction Financière', 20, 70);
    doc.text('Kinshasa, RD Congo', 20, 75);

    // Column 2: To
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATAIRE:', 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(tenant?.name || 'N/A', 120, 65);
    if (tenant?.company) doc.text(tenant.company, 120, 70);
    doc.text(`ID/RCCM: ${tenant?.idNumber || 'N/A'}`, 120, 75);
    doc.text(`Tél: ${tenant?.phone || 'N/A'}`, 120, 80);

    // Details Bar
    doc.setFillColor(243, 245, 248);
    doc.rect(20, 90, 170, 20, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('DATE D\'ÉMISSION', 25, 98);
    doc.text('DATE D\'ÉCHÉANCE', 75, 98);
    doc.text('PÉRIODE', 125, 98);
    doc.text('DEVISE', 175, 98);
    
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(invoice.createdAt), 'dd/MM/yyyy'), 25, 105);
    doc.text(format(new Date(invoice.dueDate), 'dd/MM/yyyy'), 75, 105);
    doc.text(`${months[invoice.month - 1]} ${invoice.year}`, 125, 105);
    doc.text(invoice.currency || 'USD', 175, 105);

    // Items Table
    autoTable(doc, {
      startY: 120,
      head: [['Description de l\'unité / Prestation', 'Montant Unit.']],
      body: [
        [`LOEYER MENSUEL - ${unit?.name || 'Local'} (${center?.name || 'N/A'})`, `${invoice.amountRent.toLocaleString()} ${invoice.currency}`],
        [`PROVISION EAU / SERVICES`, `${invoice.amountWater.toLocaleString()} ${invoice.currency}`],
        [`FORFAIT ÉLECTRICITÉ / ÉNERGIE`, `${invoice.amountElectricity.toLocaleString()} ${invoice.currency}`],
      ],
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { cellPadding: 8, fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { halign: 'right', cellWidth: 40, fontStyle: 'bold' }
      }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.line(120, finalY, 190, finalY);
    
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL GÉNÉRAL:', 120, finalY + 10);
    doc.setFontSize(14);
    doc.text(`${invoice.totalAmount.toLocaleString()} ${invoice.currency}`, 190, finalY + 10, { align: 'right' });
    
    doc.setFontSize(10);
    doc.text('DÉJÀ RÉGLÉ:', 120, finalY + 20);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`${invoice.amountPaid.toLocaleString()} ${invoice.currency}`, 190, finalY + 20, { align: 'right' });
    
    doc.setTextColor(239, 68, 68); // rose-500
    doc.text('SOLDE DU:', 120, finalY + 30);
    doc.text(`${(invoice.totalAmount - invoice.amountPaid).toLocaleString()} ${invoice.currency}`, 190, finalY + 30, { align: 'right' });

    // Footer
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Note: Cette facture est un titre de paiement officiel émis par l\'Etablissement GRACE. Tout retard de paiement peut entraîner des pénalités.', 105, 280, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('GRACE BANK - Excellence en Gestion Immobilière', 105, 285, { align: 'center' });

    doc.save(`Facture_${invoice.invoiceNumber || invoice.id}_${tenant?.name}.pdf`);
    toast.success('Facture PDF générée avec succès');
  };

  const handleQuickPayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;

    try {
      const paymentDate = new Date().toISOString();
      const serialNumber = `PAY-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      await DataService.add('payments', {
        invoiceId: selectedInvoice.id,
        tenantId: selectedInvoice.tenantId,
        amount: paymentAmount,
        currency: selectedInvoice.currency || 'USD',
        date: paymentDate,
        method: paymentMethod,
        reference: paymentRef,
        serialNumber,
        phoneNumber: paymentPhone,
        bankName: paymentBank
      });

      const newAmountPaid = selectedInvoice.amountPaid + paymentAmount;
      const newStatus = newAmountPaid >= selectedInvoice.totalAmount ? 'paid' : 'partial';
      
      await DataService.update('invoices', selectedInvoice.id, {
        amountPaid: newAmountPaid,
        status: newStatus
      });

      setIsPaymentOpen(false);
      toast.success('Paiement enregistré avec succès');
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const [newInvoice, setNewInvoice] = useState({
    contractId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amountWater: 0,
    amountElectricity: 0,
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    currency: 'USD' as 'USD' | 'CDF'
  });

  const handleSaveInvoice = async () => {
    const contract = contracts.find(c => c.id === newInvoice.contractId);
    if (!contract) return;

    try {
      const totalAmount = contract.rentAmount + (newInvoice.amountWater || 0) + (newInvoice.amountElectricity || 0);
      
      if (isEditingInvoice && editingInvoiceId) {
        await DataService.update('invoices', editingInvoiceId, {
          ...newInvoice,
          amountRent: contract.rentAmount,
          totalAmount,
          tenantId: contract.tenantId,
          unitId: contract.unitId,
          currency: contract.currency || newInvoice.currency
        });
        toast.success('Facture mise à jour');
      } else {
        const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const invoiceCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await DataService.add('invoices', {
          ...newInvoice,
          invoiceNumber,
          invoiceCode,
          tenantId: contract.tenantId,
          unitId: contract.unitId,
          amountRent: contract.rentAmount,
          totalAmount,
          amountPaid: 0,
          currency: contract.currency || newInvoice.currency,
          status: 'unpaid',
          createdAt: new Date().toISOString()
        });
        toast.success('Facture générée avec succès');
      }
      setIsDialogOpen(false);
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const openEditInvoice = (invoice: Invoice) => {
    if (invoice.status === 'paid') {
      toast.error('Impossible de modifier une facture déjà payée');
      return;
    }
    setEditingInvoiceId(invoice.id);
    setIsEditingInvoice(true);
    setNewInvoice({
      contractId: invoice.contractId,
      month: invoice.month,
      year: invoice.year,
      amountWater: invoice.amountWater,
      amountElectricity: invoice.amountElectricity,
      dueDate: invoice.dueDate,
      currency: invoice.currency as any
    });
    setIsDialogOpen(true);
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (statusFilter === 'all') return true;
    return invoice.status === statusFilter;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <div className="space-y-8 pb-20 no-print">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground font-sans">Facturation & Débits</h2>
          <p className="text-muted-foreground font-medium italic">Gestion des flux financiers et émissions de titres de paiement.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportToExcel} className="rounded-xl border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-black h-11 px-6 shadow-sm active:scale-95 transition-all">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Récapitulatif
          </Button>

          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger render={
              <Button variant="secondary" className="rounded-xl h-11 px-6 font-bold shadow-sm active:scale-95 transition-all">
                <Zap className="w-4 h-4 mr-2" />
                Auto-Facturation
              </Button>
            } />
            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-[450px]">
              <div className="bg-primary p-6 text-primary-foreground">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-widest">Génération Groupée</DialogTitle>
                </DialogHeader>
              </div>
              <div className="grid gap-6 p-8">
                <div className="p-4 bg-muted/30 rounded-2xl border-2 border-dashed border-muted text-xs text-muted-foreground font-medium italic">
                  Cette action émettra des factures pour tous les contrats actifs n'ayant pas encore de débits pour la période sélectionnée.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Mois de Référence</Label>
                    <Select value={bulkConfig.month.toString()} onValueChange={(val) => setBulkConfig({...bulkConfig, month: parseInt(val)})}>
                      <SelectTrigger className="rounded-xl h-12 border-2 bg-muted/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m, i) => (
                          <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Année</Label>
                    <Input 
                      type="number" 
                      value={bulkConfig.year}
                      onChange={(e) => setBulkConfig({...bulkConfig, year: parseInt(e.target.value)})}
                      className="rounded-xl h-12 border-2 bg-muted/30"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Date Limite de Paiement</Label>
                  <Input 
                    type="date" 
                    value={bulkConfig.dueDate}
                    onChange={(e) => setBulkConfig({...bulkConfig, dueDate: e.target.value})}
                    className="rounded-xl h-12 border-2 bg-muted/30"
                  />
                </div>
              </div>
              <div className="p-8 pt-0">
                <Button onClick={handleBulkGenerate} className="w-full rounded-2xl h-14 font-black shadow-xl shadow-primary/20 uppercase tracking-widest transition-all active:scale-95">Lancer l'émission</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
             setIsDialogOpen(open);
             if (!open) { setIsEditingInvoice(false); setEditingInvoiceId(null); }
          }}>
            <DialogTrigger render={
              <Button className="rounded-xl h-11 px-6 font-black shadow-lg shadow-primary/20 active:scale-95 transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Facture
              </Button>
            } />
            <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-primary p-6 text-primary-foreground flex justify-between items-center">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-widest">
                    {isEditingInvoice ? 'MODIFICATION FACTURE' : 'ÉMISSION FACTURE'}
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="grid gap-6 p-8 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Contrat de Bail Référent</Label>
                  <Select value={newInvoice.contractId} onValueChange={(val) => setNewInvoice({...newInvoice, contractId: val})}>
                    <SelectTrigger className="rounded-xl h-14 border-2 bg-muted/30">
                      <SelectValue placeholder="Sélectionner le contrat concerné" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.filter(c => c.status === 'active' || (isEditingInvoice && c.id === newInvoice.contractId)).map(c => {
                        const t = tenants.find(tenant => tenant.id === c.tenantId);
                        const u = units.find(unit => unit.id === c.unitId);
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex flex-col">
                              <span className="font-bold">{t?.name} - {u?.name}</span>
                              <span className="text-[10px] text-muted-foreground opacity-70 tracking-tighter uppercase font-black">
                                {centers.find(center => center.id === c.centerId)?.name || 'N/A'} • {c.rentAmount} {c.currency}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Mois Concerné</Label>
                    <Select defaultValue={newInvoice.month.toString()} onValueChange={(val) => setNewInvoice({...newInvoice, month: parseInt(val)})}>
                      <SelectTrigger className="rounded-xl h-12 border-2 bg-muted/30 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m, i) => (
                          <SelectItem key={i+1} value={(i+1).toString()}>{m.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Année</Label>
                    <Input 
                      type="number" 
                      value={newInvoice.year}
                      onChange={(e) => setNewInvoice({...newInvoice, year: parseInt(e.target.value)})}
                      className="rounded-xl h-12 border-2 bg-muted/30 font-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="water" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Prov. Eau</Label>
                    <Input 
                      id="water" 
                      type="number" 
                      value={newInvoice.amountWater}
                      onChange={(e) => setNewInvoice({...newInvoice, amountWater: parseFloat(e.target.value)})}
                      className="rounded-xl h-12 border-2 bg-muted/30"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="elec" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Forfait Élec.</Label>
                    <Input 
                      id="elec" 
                      type="number" 
                      value={newInvoice.amountElectricity}
                      onChange={(e) => setNewInvoice({...newInvoice, amountElectricity: parseFloat(e.target.value)})}
                      className="rounded-xl h-12 border-2 bg-muted/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-6">
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Date d'échéance</Label>
                    <Input 
                      id="dueDate" 
                      type="date" 
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                      className="rounded-xl h-12 border-2 bg-muted/30 font-bold"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Monnaie</Label>
                    <Select value={newInvoice.currency} onValueChange={(val: any) => setNewInvoice({...newInvoice, currency: val})}>
                      <SelectTrigger className="rounded-xl h-12 border-2 bg-muted/30 font-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="CDF">CDF (FC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="p-8 pt-0 flex gap-4">
                <Button variant="outline" className="flex-1 rounded-2xl h-14 font-black text-muted-foreground uppercase tracking-widest" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSaveInvoice} className="flex-[2] rounded-2xl h-14 font-black shadow-xl shadow-primary/20 uppercase tracking-widest">
                  {isEditingInvoice ? 'Modifier le Titre' : 'Valider l\'émission'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Professional Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-3xl border-none shadow-xl shadow-black/5 p-6 bg-white flex flex-col justify-between overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-5"><Receipt className="w-16 h-16" /></div>
             <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 italic">Facturation Globale (USD)</p>
             <div className="text-3xl font-black tracking-tighter text-foreground">
               {invoices.filter(i => i.currency === 'USD').reduce((acc, current) => acc + current.totalAmount, 0).toLocaleString()} <span className="text-xs font-normal opacity-50">$</span>
             </div>
          </Card>
          <Card className="rounded-3xl border-none shadow-xl shadow-black/5 p-6 bg-white flex flex-col justify-between overflow-hidden relative border-l-4 border-l-emerald-500">
             <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1 italic">Recouvrement Total (USD)</p>
             <div className="text-3xl font-black tracking-tighter text-emerald-600">
               {invoices.filter(i => i.currency === 'USD').reduce((acc, current) => acc + current.amountPaid, 0).toLocaleString()} <span className="text-xs font-normal opacity-50">$</span>
             </div>
             <div className="mt-2 text-[10px] font-black text-emerald-700 bg-emerald-100 w-fit px-2 py-0.5 rounded-full uppercase italic">
               Taux: {(((invoices.filter(i => i.currency === 'USD').reduce((acc, curr) => acc + curr.amountPaid, 0)) / (invoices.filter(i => i.currency === 'USD').reduce((acc, curr) => acc + curr.totalAmount, 0) || 1)) * 100).toFixed(1)}%
             </div>
          </Card>
          <Card className="rounded-3xl border-none shadow-xl shadow-black/5 p-6 bg-white flex flex-col justify-between overflow-hidden relative border-l-4 border-l-destructive">
             <p className="text-[10px] font-black uppercase text-destructive tracking-widest mb-1 italic">Créances Clients (USD)</p>
             <div className="text-3xl font-black tracking-tighter text-destructive">
               {(invoices.filter(i => i.currency === 'USD').reduce((acc, curr) => acc + (curr.totalAmount - curr.amountPaid), 0)).toLocaleString()} <span className="text-xs font-normal opacity-50">$</span>
             </div>
          </Card>
          <Card className="rounded-3xl border-none shadow-xl shadow-black/5 p-6 bg-white flex flex-col justify-between overflow-hidden relative">
             <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 italic">Titres en attente</p>
             <div className="text-3xl font-black tracking-tighter text-foreground">
               {invoices.filter(i => i.status === 'unpaid' || i.status === 'partial').length}
             </div>
             <div className="mt-2 text-[10px] font-black text-amber-700 bg-amber-100 w-fit px-2 py-0.5 rounded-full uppercase italic">Attention requise</div>
          </Card>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-muted/20 p-4 rounded-2xl border border-muted/50">
        <Button 
          variant={statusFilter === 'all' ? 'default' : 'ghost'} 
          onClick={() => setStatusFilter('all')}
          className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6"
        >
          Tout
        </Button>
        <Button 
          variant={statusFilter === 'unpaid' ? 'destructive' : 'ghost'} 
          onClick={() => setStatusFilter('unpaid')}
          className={cn("rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6", statusFilter !== 'unpaid' && "text-destructive")}
        >
          Impayées
        </Button>
        <Button 
          variant={statusFilter === 'partial' ? 'secondary' : 'ghost'} 
          onClick={() => setStatusFilter('partial')}
          className={cn("rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6", statusFilter !== 'partial' && "text-amber-600")}
        >
          Partielles
        </Button>
        <Button 
          variant={statusFilter === 'paid' ? 'default' : 'ghost'} 
          onClick={() => setStatusFilter('paid')}
          className={cn("rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6", statusFilter !== 'paid' && "text-emerald-600")}
        >
          Payées
        </Button>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 overflow-hidden bg-white/50 backdrop-blur-md">
        <Table>
          <TableHeader className="bg-muted/40 border-none">
            <TableRow className="border-none">
              <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">Titre de Paiement</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Tierce / Destination</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Excercice / Mois</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Montant Exigible</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">État du Titre</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => {
              const tenant = tenants.find(t => t.id === invoice.tenantId);
              const unit = units.find(u => u.id === invoice.unitId);
              
              return (
                <TableRow key={invoice.id} className="hover:bg-muted/10 border-none transition-colors border-b last:border-none">
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/20">
                         <Receipt className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-lg tracking-tighter uppercase leading-none">
                           {invoice.invoiceNumber || `INV-${String(invoice.id).slice(0, 8).toUpperCase()}`}
                        </span>
                        <span className="text-[10px] font-black font-mono text-muted-foreground opacity-60 mt-1 uppercase tracking-tighter">Code Certifié: {invoice.invoiceCode || 'N/A'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-sm font-black tracking-tight uppercase leading-none mb-1">{tenant?.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-tighter">{unit?.name} • Immeuble: {centers.find(c => c.id === unit?.centerId)?.name || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                         <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-widest opacity-80 italic italic">
                        {months[invoice.month - 1]} {invoice.year}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-black text-xl tracking-tighter flex items-center gap-1">
                        {invoice.totalAmount.toLocaleString()} <span className="text-[10px] font-bold opacity-30 italic">{invoice.currency || '$'}</span>
                      </div>
                      {invoice.amountPaid > 0 && (
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic bg-emerald-50 w-fit px-1.5 py-0.5 rounded-sm mt-1">Recouvré: {invoice.amountPaid} {invoice.currency || '$'}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest border-2 shadow-sm transition-all animate-in fade-in zoom-in-95",
                      invoice.status === 'paid' ? "bg-emerald-500 text-white border-transparent" : 
                      invoice.status === 'partial' ? "bg-amber-100 text-amber-700 border-amber-300" : 
                      "bg-destructive text-white border-transparent shadow-destructive/20"
                    )}>
                      {invoice.status === 'paid' ? 'Facture Apurée' : 
                       invoice.status === 'partial' ? 'Encaissement Partiel' : 'Dépassement de Délai / Impayée'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-muted active:scale-90 transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[180px] bg-white ring-1 ring-black/5">
                        <DropdownMenuItem onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsDetailsOpen(true);
                        }} className="rounded-xl cursor-pointer font-bold gap-3 py-2.5">
                          <Eye className="w-4 h-4 text-muted-foreground outline-none" /> Digital View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditInvoice(invoice)} disabled={invoice.status === 'paid'} className="rounded-xl cursor-pointer font-bold gap-3 py-2.5">
                          <Edit className="w-4 h-4 text-muted-foreground" /> Modifier Titre
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint(invoice)} className="rounded-xl cursor-pointer font-bold gap-3 py-2.5">
                          <Printer className="w-4 h-4 text-muted-foreground" /> Imprimer Physique
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => generateInvoicePDF(invoice)} className="rounded-xl cursor-pointer font-bold gap-3 py-2.5">
                          <Download className="w-4 h-4 text-muted-foreground" /> Archiver PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-emerald-600 rounded-xl cursor-pointer font-black gap-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 transition-colors" onClick={() => {
                          setSelectedInvoice(invoice);
                          setPaymentAmount(invoice.totalAmount - invoice.amountPaid);
                          setIsPaymentOpen(true);
                        }}>
                          <DollarSign className="w-4 h-4" /> Encaisser Fonds
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <div className="p-4 rounded-full bg-muted mb-4">
                        <Receipt className="w-12 h-12 opacity-20" />
                      </div>
                      <p className="text-lg font-medium">Aucune facture trouvée.</p>
                      <p className="text-sm">Changez de filtre ou génerer une nouvelle facture.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Invoice Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            {selectedInvoice && (() => {
              const tenant = tenants.find(t => t.id === selectedInvoice.tenantId);
              const unit = units.find(u => u.id === selectedInvoice.unitId);
              const center = centers.find(c => c.id === unit?.centerId);
              const remaining = selectedInvoice.totalAmount - selectedInvoice.amountPaid;

              return (
                <div id="invoice-details-container" className="flex flex-col">
                  <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Receipt className="w-24 h-24 rotate-12" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs uppercase tracking-wider backdrop-blur-md">
                          {selectedInvoice.status === 'paid' ? 'Payée' : 
                          selectedInvoice.status === 'partial' ? 'Partielle' : 'Impayée'}
                        </Badge>
                        <span id="invoice-date" className="text-xs opacity-70 font-medium">
                          {format(new Date(selectedInvoice.createdAt), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      <h2 id="invoice-number-title" className="text-3xl font-bold mb-1">
                        {selectedInvoice.invoiceNumber || `Facture #${String(selectedInvoice.id).slice(0, 8).toUpperCase()}`}
                      </h2>
                      <p id="invoice-code-subtitle" className="text-sm opacity-80 font-mono">CODE: {selectedInvoice.invoiceCode || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-8 space-y-8 bg-background">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold italic">Locataire</p>
                        <p id="detail-tenant-name" className="font-semibold text-lg">{tenant?.name || 'Client Inconnu'}</p>
                        {tenant?.company && <p className="text-xs text-muted-foreground">{tenant.company}</p>}
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold italic">Unité / Emplacement</p>
                        <p id="detail-unit-name" className="font-semibold text-lg">{unit?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{center?.name || 'Centre Inconnu'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold italic border-b pb-2">Détail des montants</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Loyer Mensuel</span>
                          <span className="font-mono font-medium">{selectedInvoice.amountRent.toLocaleString()} {selectedInvoice.currency}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Provision Eau</span>
                          <span className="font-mono font-medium">{selectedInvoice.amountWater.toLocaleString()} {selectedInvoice.currency}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Forfait Électricité</span>
                          <span className="font-mono font-medium">{selectedInvoice.amountElectricity.toLocaleString()} {selectedInvoice.currency}</span>
                        </div>
                        <div className="pt-4 flex justify-between items-end">
                          <div>
                            <p className="text-xs font-bold text-primary mb-1 uppercase tracking-tighter">Total à Payer</p>
                            <p id="invoice-total-amount" className="text-3xl font-black">{selectedInvoice.totalAmount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{selectedInvoice.currency}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-foreground mb-1">Mois de Facturation</p>
                            <p className="text-sm font-semibold bg-muted px-3 py-1 rounded-full">{months[selectedInvoice.month - 1]} {selectedInvoice.year}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-6 rounded-2xl space-y-4 border border-muted/50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-xs font-bold uppercase text-muted-foreground">Déjà encaissé</span>
                        </div>
                        <span id="detail-amount-paid" className="font-mono font-bold text-emerald-600">
                          {selectedInvoice.amountPaid.toLocaleString()} {selectedInvoice.currency}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-muted/20">
                        <span className="text-xs font-bold uppercase text-muted-foreground">Reste à solder</span>
                        <span id="detail-remaining-amount" className={`font-mono font-black ${remaining > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                          {remaining.toLocaleString()} {selectedInvoice.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 pt-0 flex gap-3">
                    <Button id="btn-print-invoice" className="flex-1 rounded-xl h-12 font-bold" onClick={() => handlePrint(selectedInvoice)}>
                      <Printer className="w-4 h-4 mr-2" /> Imprimer
                    </Button>
                    <Button id="btn-close-details" variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setIsDetailsOpen(false)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Quick Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Enregistrer un Paiement</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="qAmount">Montant ($)</Label>
                <Input 
                  id="qAmount" 
                  type="number" 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Méthode</Label>
                <Select defaultValue="cash" onValueChange={(val: any) => setPaymentMethod(val)}>
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
              <div className="grid gap-2">
                <Label htmlFor="qRef">Référence</Label>
                <Input 
                  id="qRef" 
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder={
                    paymentMethod === 'mobile_money' ? 'Ref transaction...' : 
                    paymentMethod === 'bank' ? 'Ref bordereau...' : 'N° reçu'
                  }
                />
              </div>

              {paymentMethod === 'mobile_money' && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label htmlFor="qPhone">Téléphone Payeur</Label>
                  <Input 
                    id="qPhone" 
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="+243..."
                  />
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label htmlFor="qBank">Banque</Label>
                  <Input 
                    id="qBank" 
                    value={paymentBank}
                    onChange={(e) => setPaymentBank(e.target.value)}
                    placeholder="Nom de la banque..."
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Annuler</Button>
              <Button onClick={handleQuickPayment}>Confirmer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog 
          open={isPrintConfirmOpen}
          onOpenChange={setIsPrintConfirmOpen}
          title="Confirmer l'impression"
          description="Êtes-vous sûr de vouloir lancer l'impression de cette facture ?"
          confirmText="Imprimer"
          variant="default"
          onConfirm={confirmPrint}
        />
      </div>

      {/* Invoice Print View */}
      {invoiceToPrint && (
        <div className="print-only p-8 max-w-[800px] mx-auto bg-white text-black">
          <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary">GRACE ADMIN</h1>
              <p className="text-gray-500 text-sm">Gestion Immobilière Professionnelle</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold">FACTURE</h2>
              <p className="text-sm"><b>N°:</b> {invoiceToPrint.invoiceNumber || `INV-${invoiceToPrint.id.toString().slice(0, 8).toUpperCase()}`}</p>
              <p className="text-sm"><b>Date:</b> {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-700 uppercase text-xs mb-2">Destinataire</h3>
              <p className="font-bold">{tenants.find(t => t.id === invoiceToPrint.tenantId)?.name || 'N/A'}</p>
              <p>{tenants.find(t => t.id === invoiceToPrint.tenantId)?.company || 'N/A'}</p>
              <p className="text-sm mt-1">Unité: {units.find(u => u.id === invoiceToPrint.unitId)?.name || 'N/A'}</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-gray-700 uppercase text-xs mb-2">Détails de facturation</h3>
              <p><b>Mois:</b> {months[invoiceToPrint.month - 1]} {invoiceToPrint.year}</p>
              <p><b>Échéance:</b> {new Date(invoiceToPrint.dueDate).toLocaleDateString('fr-FR')}</p>
              <p className="text-[10px] text-gray-400 mt-2">ID: {invoiceToPrint.invoiceCode || invoiceToPrint.id}</p>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-2 text-left px-4">Description</th>
                <th className="py-2 text-right px-4">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">Loyer Mensuel</td>
                <td className="py-3 px-4 text-right">{invoiceToPrint.amountRent.toLocaleString()} {invoiceToPrint.currency || 'USD'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Consommation Eau</td>
                <td className="py-3 px-4 text-right">{invoiceToPrint.amountWater.toLocaleString()} {invoiceToPrint.currency || 'USD'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Consommation Électricité</td>
                <td className="py-3 px-4 text-right">{invoiceToPrint.amountElectricity.toLocaleString()} {invoiceToPrint.currency || 'USD'}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end mb-12">
            <div className="w-64 bg-primary/5 p-4 rounded-lg">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>TOTAL</span>
                <span>{invoiceToPrint.totalAmount.toLocaleString()} {invoiceToPrint.currency || 'USD'}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 text-center text-gray-400 text-xs text-muted-foreground">
            <p>Merci de votre confiance. Pour toute question, veuillez nous contacter.</p>
            <p className="mt-2 font-bold opacity-50">GRACE Admin - Système de Gestion Immobilière</p>
          </div>
        </div>
      )}
    </>
  );
}
