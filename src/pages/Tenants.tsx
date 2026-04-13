import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, MoreVertical, Edit, Trash2, Phone, Mail, Briefcase, Eye } from 'lucide-react';
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
import { subscribeCollection, addDocument, deleteDocument } from '../lib/firestore';
import { Tenant } from '../types';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Tenants() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);
  const [newTenant, setNewTenant] = useState({ 
    name: '', 
    company: '', 
    manager: '', 
    phone: '', 
    email: '', 
    activityType: '' 
  });

  useEffect(() => {
    return subscribeCollection<Tenant>('tenants', setTenants);
  }, []);

  const handleAddTenant = async () => {
    if (!newTenant.name) {
      toast.error('Le nom du locataire est obligatoire');
      return;
    }
    try {
      await addDocument('tenants', newTenant);
      setNewTenant({ name: '', company: '', manager: '', phone: '', email: '', activityType: '' });
      setIsDialogOpen(false);
      toast.success('Locataire ajouté avec succès');
    } catch (e) {
      toast.error('Erreur lors de l\'ajout du locataire');
    }
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;
    try {
      await deleteDocument('tenants', tenantToDelete);
      toast.success('Locataire supprimé avec succès');
      setTenantToDelete(null);
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Locataires</h2>
          <p className="text-muted-foreground">Gérez vos clients et l'historique de leurs activités.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Locataire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter un Locataire</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom Complet</Label>
                  <Input 
                    id="name" 
                    value={newTenant.name} 
                    onChange={(e) => setNewTenant({...newTenant, name: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Entreprise</Label>
                  <Input 
                    id="company" 
                    value={newTenant.company} 
                    onChange={(e) => setNewTenant({...newTenant, company: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input 
                    id="phone" 
                    value={newTenant.phone} 
                    onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newTenant.email} 
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="activity">Type d'activité</Label>
                <Input 
                  id="activity" 
                  value={newTenant.activityType} 
                  onChange={(e) => setNewTenant({...newTenant, activityType: e.target.value})} 
                  placeholder="ex: Restaurant, Boutique de mode..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTenant}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un locataire ou une entreprise..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Locataire</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Activité</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">{tenant.company}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Phone className="w-3 h-3 mr-2" />
                      {tenant.phone}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 mr-2" />
                      {tenant.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                    {tenant.activityType}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/tenants/${tenant.id}`)}>
                        <Eye className="w-4 h-4 mr-2" /> Voir Détails
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => {
                        setTenantToDelete(tenant.id);
                        setIsConfirmOpen(true);
                      }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredTenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Users className="w-12 h-12 mb-4 opacity-20" />
                    <p>Aucun locataire trouvé.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog 
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Supprimer le locataire"
        description="Êtes-vous sûr de vouloir supprimer ce locataire ? Cette action est irréversible et supprimera toutes les données associées."
        onConfirm={handleDeleteTenant}
      />
    </div>
  );
}
