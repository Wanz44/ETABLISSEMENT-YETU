import React, { useEffect, useState } from 'react';
import { Plus, FileText, Calendar, DollarSign, MoreVertical, Edit, Trash2, User, Home } from 'lucide-react';
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
import { subscribeCollection, addDocument, updateDocument } from '../lib/firestore';
import { Contract, Tenant, Unit } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContract, setNewContract] = useState({
    tenantId: '',
    unitId: '',
    startDate: '',
    endDate: '',
    rentAmount: 0,
    chargesIncluded: false,
    status: 'active' as const
  });

  useEffect(() => {
    const unsubContracts = subscribeCollection<Contract>('contracts', setContracts);
    const unsubTenants = subscribeCollection<Tenant>('tenants', setTenants);
    const unsubUnits = subscribeCollection<Unit>('units', setUnits);
    
    return () => {
      unsubContracts();
      unsubTenants();
      unsubUnits();
    };
  }, []);

  const handleAddContract = async () => {
    if (!newContract.tenantId || !newContract.unitId || !newContract.startDate || !newContract.rentAmount) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      await addDocument('contracts', newContract);
      // Update unit status to occupied
      await updateDocument('units', newContract.unitId, { status: 'occupied' });
      
      setNewContract({
        tenantId: '',
        unitId: '',
        startDate: '',
        endDate: '',
        rentAmount: 0,
        chargesIncluded: false,
        status: 'active'
      });
      setIsDialogOpen(false);
      toast.success('Contrat créé avec succès');
    } catch (e) {
      toast.error('Erreur lors de la création du contrat');
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
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Contrat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Contrat</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Locataire</Label>
                  <Select onValueChange={(val) => setNewContract({...newContract, tenantId: val})}>
                    <SelectTrigger>
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
                  <Label>Unité (Libre)</Label>
                  <Select onValueChange={(val) => setNewContract({...newContract, unitId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une unité" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.filter(u => u.status === 'free').map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} - {u.type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={newContract.startDate}
                    onChange={(e) => setNewContract({...newContract, startDate: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">Date de fin (Optionnel)</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={newContract.endDate}
                    onChange={(e) => setNewContract({...newContract, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="grid gap-2">
                  <Label htmlFor="rent">Loyer Mensuel ($)</Label>
                  <Input 
                    id="rent" 
                    type="number" 
                    value={newContract.rentAmount}
                    onChange={(e) => setNewContract({...newContract, rentAmount: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="flex items-center space-x-2 pb-3">
                  <Checkbox 
                    id="charges" 
                    checked={newContract.chargesIncluded}
                    onCheckedChange={(val) => setNewContract({...newContract, chargesIncluded: !!val})}
                  />
                  <Label htmlFor="charges" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Charges incluses (Eau/Elec)
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddContract}>Générer le contrat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Locataire / Unité</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Loyer</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => {
              const tenant = tenants.find(t => t.id === contract.tenantId);
              const unit = units.find(u => u.id === contract.unitId);
              
              return (
                <TableRow key={contract.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-medium">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {tenant?.name || 'Inconnu'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Home className="w-3 h-3" />
                        {unit?.name || 'Inconnue'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        Du {format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })}
                        {contract.endDate && ` au ${format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr })}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-semibold">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      {contract.rentAmount.toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground ml-1">/ mois</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                      {contract.status === 'active' ? 'Actif' : 
                       contract.status === 'expired' ? 'Expiré' : 'Terminé'}
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
                          <Edit className="w-4 h-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p>Aucun contrat actif.</p>
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
