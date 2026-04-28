import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, MoreVertical, Edit, Trash2, Phone, Mail, Briefcase, Eye, CheckCircle2, Receipt, Upload, FileJson } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  
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
    address: '',
    idNumber: '',
    legalStatus: 'particular' as 'particular' | 'company',
    monthlyRent: 0,
    additionalInfo: ''
  });

  const handleSaveTenant = async () => {
    // Basic validation: Name is always required. 
    // If company, name represents the manager/contact person.
    if (!newTenant.name) {
      toast.error('Le nom du locataire ou du gérant est obligatoire');
      return;
    }

    if (newTenant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTenant.email)) {
      toast.error('Le format de l\'adresse courriel est invalide');
      return;
    }

    if (!confirm(editingTenantId ? 'Sauvegarder les modifications apportées à ce dossier locataire ?' : 'Souhaitez-vous enregistrer ce nouveau locataire ?')) {
      return;
    }
    try {
      if (editingTenantId) {
        await DataService.update('tenants', editingTenantId, newTenant);
        toast.success('Dossier locataire mis à jour');
      } else {
        await DataService.add('tenants', {
          id: crypto.randomUUID(),
          ...newTenant,
          createdAt: new Date().toISOString()
        });
        toast.success('Nouveau locataire enregistré avec succès');
      }
      
      setNewTenant({ 
        name: '', 
        company: '', 
        manager: '', 
        phone: '', 
        email: '', 
        activityType: '',
        address: '',
        idNumber: '',
        legalStatus: 'particular',
        monthlyRent: 0,
        additionalInfo: ''
      });
      setEditingTenantId(null);
      setIsDialogOpen(false);
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const openEditDialog = (tenant: any) => {
    setEditingTenantId(tenant.id);
    setNewTenant({
      name: tenant.name,
      company: tenant.company || '',
      manager: tenant.manager || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      activityType: tenant.activityType || '',
      address: tenant.address || '',
      idNumber: tenant.idNumber || '',
      legalStatus: tenant.legalStatus || 'particular',
      monthlyRent: tenant.monthlyRent || 0,
      additionalInfo: tenant.additionalInfo || ''
    });
    setIsDialogOpen(true);
  };

  const openDetails = (tenant: Tenant) => {
    setSelectedTenantDetails(tenant);
    setIsDetailsOpen(true);
  };

  const handleImportTenants = async () => {
    try {
      const parsedData = JSON.parse(importData);
      if (!Array.isArray(parsedData)) {
        toast.error('Le format doit être un tableau JSON de locataires');
        return;
      }

      const tenantsToInsert = parsedData.map(t => ({
        id: crypto.randomUUID(),
        name: t.name || 'Sans Nom',
        company: t.company || '',
        manager: t.manager || '',
        phone: t.phone || '',
        email: t.email || '',
        activityType: t.activityType || '',
        address: t.address || '',
        idNumber: t.idNumber || '',
        legalStatus: t.legalStatus || 'particular',
        monthlyRent: t.monthlyRent || 0,
        additionalInfo: t.additionalInfo || '',
        createdAt: new Date().toISOString()
      }));

      await DataService.bulkPut('tenants', tenantsToInsert);
      toast.success(`${tenantsToInsert.length} locataires importés avec succès`);
      setIsImportDialogOpen(false);
      setImportData('');
    } catch (e) {
      toast.error('Erreur lors de l\'importation: Format JSON invalide');
    }
  };
  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;
    
    // Safety check for engagement
    const hasContracts = contracts.some(c => c.tenantId === tenantToDelete);
    if (hasContracts) {
      toast.error("Impossible de supprimer : Ce locataire possède des contrats actifs ou archivés.");
      setTenantToDelete(null);
      return;
    }

    try {
      await DataService.delete('tenants', tenantToDelete);
      toast.success('Dossier locataire supprimé avec succès');
      setTenantToDelete(null);
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.company && t.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.idNumber && t.idNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const paginatedTenants = filteredTenants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase font-sans">Répertoire Locataires</h2>
          <p className="text-muted-foreground font-medium italic">Gestion centralisée des comptes clients et des dossiers juridiques.</p>
        </div>
        
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTenantId(null);
        }}>
          <DialogTrigger render={
            <Button 
                onClick={() => {
                  setNewTenant({ name: '', company: '', manager: '', phone: '', email: '', activityType: '', address: '', idNumber: '', legalStatus: 'particular', additionalInfo: '' });
                  setEditingTenantId(null);
                  setIsDialogOpen(true);
                }}
                className="rounded-xl font-black h-11 px-6 shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Locataire
            </Button>
          } />
          
          {/* New Bulk Import Button */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger render={
              <Button variant="outline" className="rounded-xl font-black h-11 px-6 border-2 border-primary/20 hover:bg-primary/5 text-primary active:scale-95 transition-all ml-2">
                <Upload className="w-4 h-4 mr-2" />
                Importation Massive
              </Button>
            } />
            <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-primary p-6 text-primary-foreground">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                    <FileJson className="w-6 h-6" /> Importation Stratégique (JSON)
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-8 space-y-4">
                <div className="p-4 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 text-xs text-primary/70 font-medium italic">
                  Collez ci-dessous le tableau JSON des locataires pour une insertion massive dans la base de données locale.
                </div>
                <textarea 
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder='[{"name": "Jean Dupont", "phone": "081..."}, ...]'
                  className="w-full h-48 rounded-2xl border-2 border-muted/50 p-4 font-mono text-xs focus:border-primary outline-none bg-muted/10 shadow-inner"
                />
                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                  Champs acceptés: name, company, phone, email, activityType, address, idNumber, legalStatus...
                </div>
              </div>
              <div className="p-8 pt-0">
                <Button onClick={handleImportTenants} className="w-full rounded-2xl h-14 font-black shadow-xl shadow-primary/20 uppercase tracking-widest">
                  Lancer l'Importation de Masse
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <DialogContent className="sm:max-w-[650px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl tracking-tight">
            <div className="bg-primary p-6 text-primary-foreground border-b-4 border-primary-dark">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tighter uppercase">
                  {editingTenantId ? 'Modification Dossier Juridique' : 'Ouverture de Compte Locataire'}
                </DialogTitle>
              </DialogHeader>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Statut Juridique</Label>
                  <Select value={newTenant.legalStatus} onValueChange={(val: any) => setNewTenant({...newTenant, legalStatus: val})}>
                    <SelectTrigger className="rounded-xl h-12 border-2 bg-muted/30 font-bold border-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular" className="font-bold py-2">PERSONNE PHYSIQUE</SelectItem>
                      <SelectItem value="company" className="font-bold py-2">PERSONNE MORALE (ENTREPRISE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                   <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">N° ID / RCCM</Label>
                   <Input 
                    value={newTenant.idNumber} 
                    onChange={(e) => setNewTenant({...newTenant, idNumber: e.target.value})} 
                    placeholder="ex: CD/KNG/RCCM/..."
                    className="rounded-xl h-12 border-2 bg-muted/30 font-bold"
                  />
                </div>
                <div className="grid gap-2">
                   <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Loyer Mensuel ($)</Label>
                   <Input 
                    type="number"
                    value={newTenant.monthlyRent} 
                    onChange={(e) => setNewTenant({...newTenant, monthlyRent: Number(e.target.value)})} 
                    placeholder="Montant du loyer"
                    className="rounded-xl h-12 border-2 bg-muted/30 font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-6">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                    {newTenant.legalStatus === 'company' ? 'Mandataire / Gérant (*)' : 'Nom Complet (*)'}
                  </Label>
                  <Input 
                    id="name" 
                    value={newTenant.name} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewTenant(prev => ({ 
                        ...prev, 
                        name: val,
                        // Automatically set manager to name for consistency
                        manager: prev.legalStatus === 'company' ? val : prev.manager 
                      }));
                    }} 
                    className="rounded-xl h-12 border-2 bg-muted/30 font-black"
                    placeholder="Obligatoire"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Raison Sociale</Label>
                  <Input 
                    id="company" 
                    disabled={newTenant.legalStatus === 'particular'}
                    value={newTenant.company} 
                    onChange={(e) => setNewTenant({...newTenant, company: e.target.value})} 
                    className="rounded-xl h-12 border-2 bg-muted/30 font-bold"
                    placeholder="Nom de l'entreprise"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Contact Téléphonique</Label>
                  <Input 
                    id="phone" 
                    value={newTenant.phone} 
                    onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})} 
                    className="rounded-xl h-12 border-2 bg-muted/30 font-black"
                    placeholder="+243..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Adresse Courriel</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newTenant.email} 
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})} 
                    className="rounded-xl h-12 border-2 bg-muted/30 font-medium"
                    placeholder="client@domaine.com"
                  />
                </div>
              </div>

              <div className="grid gap-2 border-t pt-6">
                <Label htmlFor="activity" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Domaine d'activité</Label>
                <Input 
                  id="activity" 
                  value={newTenant.activityType} 
                  onChange={(e) => setNewTenant({...newTenant, activityType: e.target.value})} 
                  placeholder="ex: Restauration, Prêt-à-porter, Consulting..."
                  className="rounded-xl h-12 border-2 bg-muted/30 font-bold"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Adresse Domicile / Siège</Label>
                <Input 
                  id="address" 
                  value={newTenant.address} 
                  onChange={(e) => setNewTenant({...newTenant, address: e.target.value})} 
                  className="rounded-xl h-12 border-2 bg-muted/30 border-muted/50 font-medium"
                  placeholder="Quartier, Commune, Ville..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="info" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Avis d'Audit / Notes Dossier</Label>
                <textarea 
                  id="info"
                  className="flex min-h-[100px] w-full rounded-2xl border-2 border-muted/30 bg-muted/10 px-4 py-3 text-sm focus-visible:outline-none focus:border-primary transition-all font-medium italic shadow-inner"
                  value={newTenant.additionalInfo}
                  onChange={(e) => setNewTenant({...newTenant, additionalInfo: e.target.value})}
                  placeholder="Historique, solvabilité prévisionnelle, ou besoins spécifiques..."
                />
              </div>
            </div>
            <div className="p-8 pt-0 flex gap-4">
               <Button variant="outline" className="flex-1 rounded-2xl h-14 font-black text-muted-foreground uppercase tracking-widest" onClick={() => setIsDialogOpen(false)}>Révoquer</Button>
               <Button onClick={handleSaveTenant} className="flex-[2] rounded-2xl h-14 font-black shadow-xl shadow-primary/20 uppercase tracking-widest">
                  {editingTenantId ? 'Entériner Modifications' : 'Confirmer Inscription'}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] tracking-tight">
          {selectedTenantDetails && (
            <div className="flex flex-col max-h-[85vh]">
              <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                  <Users className="w-64 h-64" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
                    <Users className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedTenantDetails.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="opacity-80 font-bold uppercase tracking-widest text-[9px] bg-white/20 px-3 py-1 rounded-full">{selectedTenantDetails.company || 'Dossier Personnel'}</p>
                      <Badge className="bg-emerald-500/30 text-white border-none rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest backdrop-blur-md">Certifié</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1 bg-muted/20 p-4 rounded-2xl border border-muted/50">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60 italic">Email Officiel</Label>
                    <p className="text-sm font-black truncate">{selectedTenantDetails.email || 'Non renseigné'}</p>
                  </div>
                  <div className="space-y-1 bg-muted/20 p-4 rounded-2xl border border-muted/50">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60 italic">Contact direct</Label>
                    <p className="text-sm font-black">{selectedTenantDetails.phone || 'Non renseigné'}</p>
                  </div>
                  <div className="space-y-1 bg-muted/20 p-4 rounded-2xl border border-muted/50">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60 italic">Secteur Métier</Label>
                    <p className="text-sm font-black uppercase tracking-tighter">{selectedTenantDetails.activityType || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 bg-muted/20 p-4 rounded-2xl border border-muted/50">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60 italic">Identifiant Légal</Label>
                    <p className="text-sm font-mono font-bold tracking-tighter">{selectedTenantDetails.idNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 bg-muted/20 p-4 rounded-2xl border border-muted/50">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60 italic">Domiciliation Physique</Label>
                    <p className="text-sm font-bold opacity-80">{selectedTenantDetails.address || 'N/A'}</p>
                  </div>
                </div>

                {selectedTenantDetails.additionalInfo && (
                  <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 relative shadow-inner">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><Receipt className="w-8 h-8" /></div>
                    <Label className="text-[10px] uppercase font-black text-primary tracking-widest mb-3 block">Rapport d'Audit Clientèle</Label>
                    <p className="text-xs leading-relaxed font-semibold italic text-foreground opacity-80">"{selectedTenantDetails.additionalInfo}"</p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tighter flex items-center border-b-2 border-muted pb-2">
                    <Receipt className="w-5 h-5 mr-3 text-primary" /> Track Record Financier
                  </h3>
                  <div className="grid gap-3">
                    {invoices.filter(inv => inv.tenantId === selectedTenantDetails.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 hover:ring-primary/20 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black",
                            inv.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {inv.status === 'paid' ? 'OK' : '!!'}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tighter">{inv.invoiceNumber || `FAC-${String(inv.id).slice(0, 4).toUpperCase()}`}</p>
                            <p className="text-[10px] text-muted-foreground font-bold opacity-60 italic">{format(new Date(inv.createdAt), 'MMMM yyyy', {locale: fr})}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-foreground">{inv.totalAmount.toLocaleString()} {inv.currency}</p>
                          <Badge variant="outline" className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0 border-none",
                            inv.status === 'paid' ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                          )}>
                            {inv.status === 'paid' ? 'Soldé' : 'Arriéré'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {invoices.filter(inv => inv.tenantId === selectedTenantDetails.id).length === 0 && (
                      <div className="text-center py-12 bg-muted/10 rounded-3xl border-2 border-dashed">
                        <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                        <p className="text-xs text-muted-foreground font-medium italic">Aucun flux financier audité pour ce preneur.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-8 border-t bg-muted/20 flex gap-4">
                <Button className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20" onClick={() => setIsDetailsOpen(false)}>Clôturer l'Audit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/20 p-4 rounded-3xl border border-muted/50">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrer par nom, gérant ou RCCM..." 
            className="pl-12 h-12 rounded-2xl border-none bg-white shadow-sm ring-1 ring-black/5 text-xs font-black uppercase tracking-tighter"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-[10px] uppercase font-black text-muted-foreground mr-4">
          Affichage: <span className="text-primary">{paginatedTenants.length}</span> sur {filteredTenants.length} Locataires
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white/50 backdrop-blur-md">
        <Table>
          <TableHeader className="bg-muted/40 border-none">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8 py-4">Locataire & Identité</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Coordonnées Directes</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Profil d'Activité</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Statut de Bail</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest pr-8 py-4">Opérations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTenants.map((tenant) => {
              const hasActiveContract = contracts.some(c => c.tenantId === tenant.id && c.status === 'active');
              
              return (
                <TableRow key={tenant.id} className="hover:bg-muted/10 border-none transition-colors border-b last:border-none">
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/20">
                         <Users className="w-5 h-5" />
                      </div>
                        <div className="flex flex-col">
                          <span className="font-black text-lg tracking-tighter uppercase leading-none">
                            {tenant.legalStatus === 'company' ? tenant.company : tenant.name}
                          </span>
                          <span className="text-[10px] font-black text-muted-foreground opacity-60 mt-1 uppercase tracking-tighter">
                            {tenant.legalStatus === 'company' ? `Mandataire: ${tenant.name}` : 'Compte Particulier'}
                          </span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-tighter">
                        <Phone className="w-3 h-3 mr-2 opacity-50" />
                        {tenant.phone || 'N/A'}
                      </div>
                      <div className="flex items-center text-[10px] font-semibold text-muted-foreground lowercase opacity-70 italic">
                        <Mail className="w-3 h-3 mr-2 opacity-50" />
                        {tenant.email || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest bg-muted/40 px-3 py-1.5 rounded-full w-fit border shadow-inner ring-1 ring-black/5">
                      <Briefcase className="w-3.5 h-3.5 mr-2 opacity-40 text-primary" />
                      {tenant.activityType || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {hasActiveContract ? (
                      <div className="flex items-center text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Engagement Actif
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full w-fit border border-amber-200">
                         Vacance Contractuelle
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-muted active:scale-90 transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[180px] bg-white ring-1 ring-black/5">
                        <DropdownMenuItem onClick={() => openDetails(tenant)} className="rounded-xl cursor-pointer font-bold gap-3 py-2.5">
                          <Eye className="w-4 h-4 text-primary mr-2" /> Audit du Dossier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/tenants/${tenant.id}`)} className="rounded-xl cursor-pointer font-bold gap-3 py-2.5">
                          <Receipt className="w-4 h-4 text-blue-600 mr-2" /> Situation Bancaire
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(tenant)} className="rounded-xl cursor-pointer font-bold gap-3 py-2.5">
                          <Edit className="w-4 h-4 text-muted-foreground mr-2" /> Modification Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive rounded-xl cursor-pointer font-bold gap-3 py-2.5" onClick={() => {
                          setTenantToDelete(tenant.id);
                          setIsConfirmOpen(true);
                        }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Prononcer Radiation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredTenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-32">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <div className="p-8 rounded-full bg-muted/20 mb-6">
                      <Users className="w-16 h-16 opacity-10" />
                    </div>
                    <p className="text-xl font-black uppercase tracking-tighter">Répertoire Vide</p>
                    <p className="text-sm italic font-medium opacity-60">Aucun preneur ne correspond à votre recherche stratégique.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="p-8 border-t bg-muted/20 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">
              Page <span className="text-primary">{currentPage}</span> sur {totalPages}
            </p>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-black uppercase tracking-widest text-[9px] h-10 px-6 border-2"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Précédent
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-black uppercase tracking-widest text-[9px] h-10 px-6 border-2"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog 
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="RADIATION DU LOCATAIRE"
        description="Êtes-vous certain de vouloir radier définitivement ce locataire ? Cette action effacera irrémédiablement toutes les archives contractuelles liées à ce preneur."
        onConfirm={handleDeleteTenant}
      />
    </div>
  );
 }
