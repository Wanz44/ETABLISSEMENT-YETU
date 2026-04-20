import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, MoreVertical, Edit, Trash2, Phone, Mail, Briefcase, Eye, CheckCircle2, Receipt } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../lib/db';
import { DataService } from '../lib/data';
import { Tenant } from '../types';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Tenants() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<any>(null);
  
  const [editingTenantId, setEditingTenantId] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTenantDetails, setSelectedTenantDetails] = useState<Tenant | null>(null);
  
  const data = useLiveQuery(async () => {
    return {
      tenants: await dbLocal.tenants.toArray(),
      contracts: await dbLocal.contracts.toArray(),
      invoices: await dbLocal.invoices.toArray()
    };
  }) || { tenants: [], contracts: [], invoices: [] };

  const { tenants, contracts, invoices } = data;

  const [newTenant, setNewTenant] = useState({ 
    name: '', 
    company: '', 
    manager: '', 
    phone: '', 
    email: '', 
    activityType: '',
    additionalInfo: ''
  });

  const handleSaveTenant = async () => {
    if (!newTenant.name) {
      toast.error('Le nom du locataire est obligatoire');
      return;
    }
    try {
      if (editingTenantId) {
        await DataService.update('tenants', editingTenantId, newTenant);
        toast.success('Locataire mis à jour avec succès');
      } else {
        await DataService.add('tenants', {
          ...newTenant,
          createdAt: new Date().toISOString()
        });
        toast.success('Locataire enregistré avec succès');
      }
      
      setNewTenant({ 
        name: '', 
        company: '', 
        manager: '', 
        phone: '', 
        email: '', 
        activityType: '',
        additionalInfo: ''
      });
      setEditingTenantId(null);
      setIsDialogOpen(false);
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditingTenantId(tenant.id);
    setNewTenant({
      name: tenant.name,
      company: tenant.company || '',
      manager: tenant.manager || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      activityType: tenant.activityType || '',
      additionalInfo: tenant.additionalInfo || ''
    });
    setIsDialogOpen(true);
  };

  const openDetails = (tenant: Tenant) => {
    setSelectedTenantDetails(tenant);
    setIsDetailsOpen(true);
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;
    try {
      await DataService.delete('tenants', tenantToDelete);
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
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTenantId(null);
        }}>
          <DialogTrigger render={
            <Button onClick={() => {
              setNewTenant({ name: '', company: '', manager: '', phone: '', email: '', activityType: '', additionalInfo: '' });
              setEditingTenantId(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Locataire
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTenantId ? 'Modifier le Locataire' : 'Ajouter un Locataire'}</DialogTitle>
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
              <div className="grid gap-2">
                <Label htmlFor="info">Informations Complémentaires</Label>
                <textarea 
                  id="info"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newTenant.additionalInfo}
                  onChange={(e) => setNewTenant({...newTenant, additionalInfo: e.target.value})}
                  placeholder="Notes, historique, ou besoins spécifiques..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveTenant}>{editingTenantId ? 'Sauvegarder les modifications' : 'Enregistrer'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          {selectedTenantDetails && (
            <div className="flex flex-col max-h-[85vh]">
              <div className="bg-primary p-6 text-primary-foreground">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTenantDetails.name}</h2>
                    <p className="opacity-80">{selectedTenantDetails.company || 'Compte Personnel'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground italic">Email</Label>
                    <p className="text-sm font-medium">{selectedTenantDetails.email || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground italic">Téléphone</Label>
                    <p className="text-sm font-medium">{selectedTenantDetails.phone || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground italic">Activité</Label>
                    <p className="text-sm font-medium">{selectedTenantDetails.activityType || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground italic">Inscrit le</Label>
                    <p className="text-sm font-medium">{new Date(selectedTenantDetails.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedTenantDetails.additionalInfo && (
                  <div className="p-4 bg-muted/30 rounded-2xl border border-muted/50">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground italic mb-2 block">Informations Complémentaires</Label>
                    <p className="text-xs leading-relaxed text-muted-foreground italic">"{selectedTenantDetails.additionalInfo}"</p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2 flex items-center">
                    <Receipt className="w-4 h-4 mr-2" /> Historique récent des factures
                  </h3>
                  <div className="space-y-2">
                    {invoices.filter(inv => inv.tenantId === selectedTenantDetails.id).slice(0, 5).map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-muted/20 hover:bg-muted/40 transition-colors">
                        <div>
                          <p className="text-xs font-bold">{inv.invoiceNumber || `Facture #${String(inv.id).slice(0, 4).toUpperCase()}`}</p>
                          <p className="text-[9px] text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold">{inv.totalAmount} {inv.currency}</p>
                          <p className={`text-[9px] font-bold ${inv.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {inv.status.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {invoices.filter(inv => inv.tenantId === selectedTenantDetails.id).length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-4 italic">Aucun historique de facturation trouvé.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t bg-muted/10 flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="rounded-xl">Fermer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <TableHead>Statut Contrat</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.map((tenant) => {
              const hasActiveContract = contracts.some(c => c.tenantId === tenant.id && c.status === 'active');
              
              return (
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
                  <TableCell>
                    {hasActiveContract ? (
                      <div className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full w-fit">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Actif
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded-full w-fit">
                         Aucun actif
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetails(tenant)}>
                        <Eye className="w-4 h-4 mr-2" /> Voir Détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(tenant)}>
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
            );
          })}
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
