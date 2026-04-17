import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  MoreVertical, 
  Edit, 
  Trash2, 
  User, 
  Home, 
  Building2,
  Briefcase,
  Layers,
  Info,
  ShieldCheck
} from 'lucide-react';
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
import { Checkbox } from '../components/ui/checkbox';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../lib/db';
import { DataService } from '../lib/data';
import { Contract, Tenant, Unit, Center } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Contracts() {
  const data = useLiveQuery(async () => {
    return {
      contracts: await dbLocal.contracts.toArray(),
      tenants: await dbLocal.tenants.toArray(),
      units: await dbLocal.units.toArray(),
      centers: await dbLocal.centers.toArray(),
    };
  }) || { contracts: [], tenants: [], units: [], centers: [] };

  const { contracts, tenants, units, centers } = data;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  
  const [newContract, setNewContract] = useState({
    tenantId: '',
    unitId: '',
    centerId: '',
    startDate: '',
    endDate: '',
    rentAmount: 0,
    depositAmount: 0,
    currency: 'USD' as const,
    chargesIncluded: false,
    status: 'active' as const,
    type: 'commercial' as const,
    notes: ''
  });

  // Filter units based on selected center
  const availableUnits = units.filter(u => 
    u.status === 'free' && (!selectedCenterId || u.centerId === selectedCenterId)
  );

  const handleAddContract = async () => {
    if (!newContract.tenantId || !newContract.unitId || !newContract.startDate || !newContract.rentAmount || !newContract.centerId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      await DataService.add('contracts', newContract);
      // Update unit status to occupied
      await DataService.update('units', newContract.unitId, { status: 'occupied' });
      
      setNewContract({
        tenantId: '',
        unitId: '',
        centerId: '',
        startDate: '',
        endDate: '',
        rentAmount: 0,
        depositAmount: 0,
        currency: 'USD',
        chargesIncluded: false,
        status: 'active',
        type: 'commercial',
        notes: ''
      });
      setSelectedCenterId('');
      setIsDialogOpen(false);
      toast.success('Contrat créé avec succès (Local-First)');
    } catch (e) {
      toast.error('Erreur lors de la création du contrat');
    }
  };

  const getContractTypeLabel = (type: string) => {
    switch(type) {
      case 'commercial': return 'Commercial';
      case 'professional': return 'Professionnel';
      case 'residential': return 'Résidentiel';
      default: return type;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contrats de Location</h2>
          <p className="text-muted-foreground">Gérez les baux et les conditions de location.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Contrat
            </Button>
          } />
          <DialogContent className="sm:max-w-[700px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Créer un Nouveau Contrat</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Locataire
                  </Label>
                  <Select onValueChange={(val) => setNewContract({...newContract, tenantId: val})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sélectionner un locataire" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name} ({t.company})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Centre Commercial
                  </Label>
                  <Select onValueChange={(val) => {
                    setSelectedCenterId(val);
                    setNewContract({...newContract, centerId: val, unitId: ''});
                  }}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sélectionner un centre" />
                    </SelectTrigger>
                    <SelectContent>
                      {centers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-primary" />
                    Unité (Libre)
                  </Label>
                  <Select 
                    value={newContract.unitId}
                    onValueChange={(val) => setNewContract({...newContract, unitId: val})}
                    disabled={!selectedCenterId}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={selectedCenterId ? "Sélectionner une unité" : "Sélectionner d'abord un centre"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} - {u.type} (Etage {u.floor})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Type de Contrat
                  </Label>
                  <Select value={newContract.type} onValueChange={(val: any) => setNewContract({...newContract, type: val})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="professional">Professionnel</SelectItem>
                      <SelectItem value="residential">Résidentiel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Date de début
                  </Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    className="rounded-xl"
                    value={newContract.startDate}
                    onChange={(e) => setNewContract({...newContract, startDate: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Date de fin (Optionnel)
                  </Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    className="rounded-xl"
                    value={newContract.endDate}
                    onChange={(e) => setNewContract({...newContract, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="rent" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Loyer Mensuel
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      id="rent" 
                      type="number" 
                      className="flex-1 rounded-xl"
                      value={newContract.rentAmount}
                      onChange={(e) => setNewContract({...newContract, rentAmount: parseFloat(e.target.value)})}
                    />
                    <Select value={newContract.currency} onValueChange={(val: any) => setNewContract({...newContract, currency: val})}>
                      <SelectTrigger className="w-24 rounded-xl">
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
                  <Label htmlFor="deposit" className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Garantie Locative
                  </Label>
                  <Input 
                    id="deposit" 
                    type="number" 
                    className="rounded-xl"
                    placeholder="Montant de la caution"
                    value={newContract.depositAmount}
                    onChange={(e) => setNewContract({...newContract, depositAmount: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="charges" 
                    checked={newContract.chargesIncluded}
                    onCheckedChange={(val) => setNewContract({...newContract, chargesIncluded: !!val})}
                  />
                  <Label htmlFor="charges" className="text-sm font-medium leading-none">
                    Charges incluses (Eau, Electricité, Surveillance)
                  </Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    Notes & Observations
                  </Label>
                  <Input 
                    id="notes" 
                    placeholder="Détails supplémentaires..." 
                    className="rounded-xl"
                    value={newContract.notes}
                    onChange={(e) => setNewContract({...newContract, notes: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddContract} className="w-full sm:w-auto rounded-xl px-8">Générer le contrat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Locataire / Unité</TableHead>
              <TableHead className="font-bold">Centre / Type</TableHead>
              <TableHead className="font-bold">Période</TableHead>
              <TableHead className="font-bold">Loyer</TableHead>
              <TableHead className="font-bold">Statut</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => {
              const tenant = tenants.find(t => t.id === contract.tenantId);
              const unit = units.find(u => u.id === contract.unitId);
              const center = centers.find(c => c.id === contract.centerId);
              
              return (
                <TableRow key={contract.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <User className="w-3.5 h-3.5 text-primary" />
                        {tenant?.name || 'Inconnu'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Home className="w-3 h-3" />
                        {unit?.name || 'Inconnue'} ({unit?.type})
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {center?.name || 'Non spécifié'}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Briefcase className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{getContractTypeLabel(contract.type)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      {contract.endDate && (
                        <div className="text-[10px] text-muted-foreground ml-6 uppercase font-bold">
                          Jusqu'au {format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 font-bold text-lg">
                        {contract.rentAmount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{contract.currency || 'USD'}</span>
                      </div>
                      {contract.depositAmount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">
                          Caution: {contract.depositAmount.toLocaleString()} {contract.currency}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={Jt(
                        "rounded-lg",
                        contract.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 
                        'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {contract.status === 'active' ? 'Actif' : 
                       contract.status === 'expired' ? 'Expiré' : 'Terminé'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" /> Résilier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {contracts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <FileText className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="text-lg font-medium">Aucun contrat actif.</p>
                    <p className="text-sm">Commencez par créer le premier contrat de bail.</p>
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

// Simple helper for class names
function Jt(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
