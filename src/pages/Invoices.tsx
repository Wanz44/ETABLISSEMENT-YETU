import React, { useEffect, useState } from 'react';
import { Plus, Receipt, Calendar, DollarSign, MoreVertical, Download, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { subscribeCollection, addDocument } from '../lib/firestore';
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

    try {
      await addDocument('invoices', {
        ...newInvoice,
        tenantId: contract.tenantId,
        unitId: contract.unitId,
        amountRent: contract.rentAmount,
        totalAmount,
        amountPaid: 0,
        status: 'unpaid'
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
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Générer Facture
            </Button>
          </DialogTrigger>
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
                    <div className="flex items-center gap-2 font-medium">
                      <Receipt className="w-4 h-4 text-muted-foreground" />
                      INV-{invoice.year}{invoice.month.toString().padStart(2, '0')}-{invoice.id.slice(0, 4).toUpperCase()}
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
                      {invoice.totalAmount.toLocaleString()} $
                    </div>
                    {invoice.amountPaid > 0 && (
                      <p className="text-[10px] text-emerald-600 font-medium">Payé: {invoice.amountPaid} $</p>
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
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" /> Télécharger PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="w-4 h-4 mr-2" /> Envoyer par Email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-emerald-600">
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
    </div>
  );
}
