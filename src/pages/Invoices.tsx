import React, { useEffect, useState } from 'react';
import { Plus, Receipt, Calendar, DollarSign, MoreVertical, Download, Send, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { subscribeCollection, addDocument, updateDocument } from '../lib/firestore';
import { Invoice, Contract, Tenant, Unit } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'bank'>('cash');
  const [paymentRef, setPaymentRef] = useState('');

  const handleQuickPayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;

    try {
      const paymentDate = new Date().toISOString();
      await addDocument('payments', {
        invoiceId: selectedInvoice.id,
        tenantId: selectedInvoice.tenantId,
        amount: paymentAmount,
        date: paymentDate,
        method: paymentMethod,
        reference: paymentRef
      });

      const newAmountPaid = selectedInvoice.amountPaid + paymentAmount;
      const newStatus = newAmountPaid >= selectedInvoice.totalAmount ? 'paid' : 'partial';
      
      await updateDocument('invoices', selectedInvoice.id, {
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
    dueDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    const unsubInvoices = subscribeCollection<Invoice>('invoices', setInvoices);
    const unsubContracts = subscribeCollection<Contract>('contracts', setContracts);
    const unsubTenants = subscribeCollection<Tenant>('tenants', setTenants);
    const unsubUnits = subscribeCollection<Unit>('units', setUnits);
    
    return () => {
      unsubInvoices();
      unsubContracts();
      unsubTenants();
      unsubUnits();
    };
  }, []);

  const handleGenerateInvoice = async () => {
    const contract = contracts.find(c => c.id === newInvoice.contractId);
    if (!contract) return;

    const totalAmount = contract.rentAmount + newInvoice.amountWater + newInvoice.amountElectricity;
    const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      await addDocument('invoices', {
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

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Facturation</h2>
          <p className="text-muted-foreground">Gérez les factures mensuelles et le suivi des paiements.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
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
                          {t?.name} - {u?.name} ({c.rentAmount} $)
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

              <div className="grid gap-2">
                <Label htmlFor="dueDate">Date d'échéance</Label>
                <Input 
                  id="dueDate" 
                  type="date" 
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleGenerateInvoice}>Générer la facture</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facture</TableHead>
              <TableHead>Locataire / Unité</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const tenant = tenants.find(t => t.id === invoice.tenantId);
              const unit = units.find(u => u.id === invoice.unitId);
              
              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-medium">
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                        {invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`}
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
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Receipt className="w-12 h-12 mb-4 opacity-20" />
                    <p>Aucune facture générée.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Détails de la Facture</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">N° Facture</p>
                  <p className="font-bold">{selectedInvoice.invoiceNumber || 'N/A'}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Code: {selectedInvoice.invoiceCode || 'N/A'}</p>
                </div>
                <Badge variant={
                  selectedInvoice.status === 'paid' ? 'default' : 
                  selectedInvoice.status === 'partial' ? 'secondary' : 'destructive'
                }>
                  {selectedInvoice.status === 'paid' ? 'Payée' : 
                   selectedInvoice.status === 'partial' ? 'Partielle' : 'Impayée'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loyer Mensuel</span>
                  <span className="font-medium">{selectedInvoice.amountRent.toLocaleString()} {selectedInvoice.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consommation Eau</span>
                  <span className="font-medium">{selectedInvoice.amountWater.toLocaleString()} {selectedInvoice.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consommation Électricité</span>
                  <span className="font-medium">{selectedInvoice.amountElectricity.toLocaleString()} {selectedInvoice.currency}</span>
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-bold">TOTAL À PAYER</span>
                  <span className="text-xl font-bold text-primary">{selectedInvoice.totalAmount.toLocaleString()} {selectedInvoice.currency}</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Déjà payé</span>
                  <span className="font-semibold text-emerald-600">{selectedInvoice.amountPaid.toLocaleString()} {selectedInvoice.currency}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Reste à payer</span>
                  <span className="font-semibold text-destructive">{(selectedInvoice.totalAmount - selectedInvoice.amountPaid).toLocaleString()} {selectedInvoice.currency}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Fermer</Button>
          </DialogFooter>
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
                placeholder="N° Reçu, Ref..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Annuler</Button>
            <Button onClick={handleQuickPayment}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
