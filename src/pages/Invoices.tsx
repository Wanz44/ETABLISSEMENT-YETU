import React, { useEffect, useState } from 'react';
import { Plus, Receipt, Calendar, DollarSign, MoreVertical, Download, Send, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
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
    saveAs(dataBlob, `Factures_Yetu_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
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
    setInvoiceToPrint(selectedInvoice);
    setTimeout(() => {
      window.print();
    }, 100);
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

  const handleGenerateInvoice = async () => {
    const contract = contracts.find(c => c.id === newInvoice.contractId);
    if (!contract) return;

    const totalAmount = contract.rentAmount + newInvoice.amountWater + newInvoice.amountElectricity;
    const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      await DataService.add('invoices', {
        ...newInvoice,
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
      setIsDialogOpen(false);
      toast.success('Facture générée avec succès');
    } catch (e) {
      toast.error('Erreur lors de la génération de la facture');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (statusFilter === 'all') return true;
    return invoice.status === statusFilter;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8">
      <div className="no-print">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Facturation</h2>
            <p className="text-muted-foreground">Gérez vos factures mensuelles et suivez les paiements.</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel} className="rounded-xl border-emerald-200 hover:bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>

            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
              <DialogTrigger render={
                <Button variant="secondary" className="rounded-xl">
                  <Zap className="w-4 h-4 mr-2" />
                  Génération Groupée
                </Button>
              } />
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Facturation Groupée</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    Générez automatiquement les factures de loyer pour TOUS les contrats actifs qui n'en ont pas encore pour cette période.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Mois</Label>
                      <Select value={bulkConfig.month.toString()} onValueChange={(val) => setBulkConfig({...bulkConfig, month: parseInt(val)})}>
                        <SelectTrigger className="rounded-xl">
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
                      <Label>Année</Label>
                      <Input 
                        type="number" 
                        value={bulkConfig.year}
                        onChange={(e) => setBulkConfig({...bulkConfig, year: parseInt(e.target.value)})}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Date d'échéance</Label>
                    <Input 
                      type="date" 
                      value={bulkConfig.dueDate}
                      onChange={(e) => setBulkConfig({...bulkConfig, dueDate: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleBulkGenerate} className="rounded-xl w-full">Lancer la génération</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={
                <Button className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Générer Facture
                </Button>
              } />
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Générer une Facture Mensuelle</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label>Contrat Actif</Label>
                    <Select onValueChange={(val) => setNewInvoice({...newInvoice, contractId: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un contrat" />
                      </SelectTrigger>
                      <SelectContent>
                        {contracts.filter(c => c.status === 'active').map(c => {
                          const t = tenants.find(tenant => tenant.id === c.tenantId);
                          const u = units.find(unit => unit.id === c.unitId);
                          return (
                            <SelectItem key={c.id} value={c.id}>
                              <div className="flex flex-col">
                                <span>{t?.name} - {u?.name}</span>
                                <span className="text-[10px] text-muted-foreground opacity-70">
                                  {centers.find(center => center.id === c.centerId)?.name || 'N/A'} • {c.rentAmount} {c.currency}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Mois</Label>
                      <Select defaultValue={newInvoice.month.toString()} onValueChange={(val) => setNewInvoice({...newInvoice, month: parseInt(val)})}>
                        <SelectTrigger>
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
                      <Label>Année</Label>
                      <Input 
                        type="number" 
                        value={newInvoice.year}
                        onChange={(e) => setNewInvoice({...newInvoice, year: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="water">Eau ($)</Label>
                      <Input 
                        id="water" 
                        type="number" 
                        value={newInvoice.amountWater}
                        onChange={(e) => setNewInvoice({...newInvoice, amountWater: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="elec">Électricité ($)</Label>
                      <Input 
                        id="elec" 
                        type="number" 
                        value={newInvoice.amountElectricity}
                        onChange={(e) => setNewInvoice({...newInvoice, amountElectricity: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dueDate">Date d'échéance</Label>
                      <Input 
                        id="dueDate" 
                        type="date" 
                        value={newInvoice.dueDate}
                        onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Devise</Label>
                      <Select value={newInvoice.currency} onValueChange={(val: any) => setNewInvoice({...newInvoice, currency: val})}>
                        <SelectTrigger>
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
                <DialogFooter>
                  <Button onClick={handleGenerateInvoice}>Générer la facture</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('all')}
            className="rounded-xl"
          >
            Toutes
          </Button>
          <Button 
            variant={statusFilter === 'unpaid' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('unpaid')}
            className="rounded-xl"
          >
            Impayées
          </Button>
          <Button 
            variant={statusFilter === 'partial' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('partial')}
            className="rounded-xl"
          >
            Partielles
          </Button>
          <Button 
            variant={statusFilter === 'paid' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('paid')}
            className="rounded-xl"
          >
            Payées
          </Button>
        </div>

        <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Facture</TableHead>
                <TableHead className="font-bold">Locataire / Unité</TableHead>
                <TableHead className="font-bold">Période</TableHead>
                <TableHead className="font-bold">Total</TableHead>
                <TableHead className="font-bold">Statut</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const tenant = tenants.find(t => t.id === invoice.tenantId);
                const unit = units.find(u => u.id === invoice.unitId);
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 font-medium">
                          <Receipt className="w-4 h-4 text-muted-foreground" />
                          {invoice.invoiceNumber || `INV-${String(invoice.id).slice(0, 8).toUpperCase()}`}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono ml-6">Code: {invoice.invoiceCode || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{tenant?.name}</p>
                        <p className="text-xs text-muted-foreground">{unit?.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {months[invoice.month - 1]} {invoice.year}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {invoice.totalAmount.toLocaleString()} {invoice.currency || '$'}
                      </div>
                      {invoice.amountPaid > 0 && (
                        <p className="text-[10px] text-emerald-600 font-medium">Payé: {invoice.amountPaid} {invoice.currency || '$'}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        invoice.status === 'paid' ? 'default' : 
                        invoice.status === 'partial' ? 'secondary' : 'destructive'
                      } className="flex w-fit items-center gap-1">
                        {invoice.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {invoice.status === 'paid' ? 'Payée' : 
                         invoice.status === 'partial' ? 'Partielle' : 'Impayée'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsDetailsOpen(true);
                          }}>
                            <Eye className="w-4 h-4 mr-2" /> Voir Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(invoice)}>
                            <Printer className="w-4 h-4 mr-2" /> Imprimer Facture
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" /> Télécharger PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="w-4 h-4 mr-2" /> Envoyer par Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-emerald-600" onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentAmount(invoice.totalAmount - invoice.amountPaid);
                            setIsPaymentOpen(true);
                          }}>
                            <DollarSign className="w-4 h-4 mr-2" /> Enregistrer Paiement
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
              <h1 className="text-3xl font-bold text-primary">YETU ADMIN</h1>
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
            <p className="mt-2 font-bold opacity-50">YETU Admin - Système de Gestion Immobilière</p>
          </div>
        </div>
      )}
    </div>
  );
}
