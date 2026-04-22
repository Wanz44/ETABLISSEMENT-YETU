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
  ShieldCheck,
  Download,
  Search
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContractId, setEditingContractId] = useState<string|null>(null);
  const [isEditingContract, setIsEditingContract] = useState(false);
  
  const [newContract, setNewContract] = useState({
    tenantId: '',
    unitId: '',
    centerId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
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
    (u.status === 'free' || (isEditingContract && u.id === newContract.unitId)) && (!selectedCenterId || u.centerId === selectedCenterId)
  );

  const handleSaveContract = async () => {
    if (!newContract.tenantId || !newContract.unitId || !newContract.startDate || !newContract.rentAmount || !newContract.centerId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      if (isEditingContract && editingContractId) {
        await DataService.update('contracts', editingContractId, newContract);
        toast.success('Bail mis à jour avec succès');
      } else {
        await DataService.add('contracts', {
          ...newContract,
          createdAt: new Date().toISOString()
        });
        // Update unit status to occupied
        await DataService.update('units', newContract.unitId, { status: 'occupied' });
        toast.success('Contrat créé avec succès (Local-First)');
      }
      
      setNewContract({
        tenantId: '',
        unitId: '',
        centerId: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
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
      setEditingContractId(null);
      setIsEditingContract(false);
      setIsDialogOpen(false);
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleResiliate = async (id: string, unitId: string) => {
    try {
      await DataService.update('contracts', id, { status: 'terminated' });
      await DataService.update('units', unitId, { status: 'free' });
      toast.success('Le contrat a été résilié. L\'unité est à nouveau libre.');
    } catch (e) {
      toast.error('Échec de la résiliation');
    }
  };

  const openEditContract = (contract: Contract) => {
    setEditingContractId(contract.id);
    setIsEditingContract(true);
    setSelectedCenterId(contract.centerId);
    setNewContract({
      tenantId: contract.tenantId || '',
      unitId: contract.unitId || '',
      centerId: contract.centerId || '',
      startDate: contract.startDate || '',
      endDate: contract.endDate || '',
      rentAmount: contract.rentAmount || 0,
      depositAmount: contract.depositAmount || 0,
      currency: (contract.currency as any) || 'USD',
      chargesIncluded: contract.chargesIncluded || false,
      status: (contract.status as any) || 'active',
      type: (contract.type as any) || 'commercial',
      notes: (contract as any).notes || ''
    });
    setIsDialogOpen(true);
  };

  const filteredContracts = contracts.filter(c => {
    const tenant = tenants.find(t => t.id === c.tenantId);
    const unit = units.find(u => u.id === c.unitId);
    const term = searchTerm.toLowerCase();
    return (tenant?.name?.toLowerCase().includes(term) || unit?.name?.toLowerCase().includes(term));
  });

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'commercial': return 'Commercial';
      case 'professional': return 'Professionnel';
      case 'residential': return 'Résidentiel';
      default: return type;
    }
  };

  const generateContractPDF = (contract: Contract) => {
    const tenant = tenants.find(t => t.id === contract.tenantId);
    const unit = units.find(u => u.id === contract.unitId);
    const center = centers.find(c => c.id === contract.centerId);

    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(31, 41, 55); // Dark gray
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRAT DE BAIL', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Réf: ${String(contract.id).toUpperCase().slice(0, 8)}`, 105, 30, { align: 'center' });

    // Parties
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('PARTIES CONTRACTANTES', 20, 55);
    doc.line(20, 57, 80, 57);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BAILLEUR:', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text('YETU ADMIN / GESTION IMMOBILIERE', 60, 65);

    doc.setFont('helvetica', 'bold');
    doc.text('PRENEUR (LOCATAIRE):', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(tenant?.name || 'N/A', 60, 75);
    if (tenant?.company) {
      doc.text(`Entreprise: ${tenant.company}`, 60, 80);
    }
    doc.text(`Contact: ${tenant?.phone || 'N/A'} / ${tenant?.email || 'N/A'}`, 60, 85);

    // Objet
    doc.setFontSize(14);
    doc.text('OBJET DU BAIL', 20, 100);
    doc.line(20, 102, 60, 102);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CENTRE:', 20, 110);
    doc.setFont('helvetica', 'normal');
    doc.text(center?.name || 'N/A', 60, 110);

    doc.setFont('helvetica', 'bold');
    doc.text('UNITE (LOCAL):', 20, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(unit?.name || 'N/A', 60, 120);
    doc.text(`Type: ${unit?.type || 'N/A'} - Niveau: ${unit?.floor || 'N/A'}`, 60, 125);

    // Terms
    doc.setFontSize(14);
    doc.text('CONDITIONS FINANCIERES ET DUREE', 20, 140);
    doc.line(20, 142, 95, 142);

    autoTable(doc, {
      startY: 150,
      head: [['Désignation', 'Détails']],
      body: [
        ['Date d\'effet', format(new Date(contract.startDate), 'dd MMMM yyyy', { locale: fr })],
        ['Date d\'échéance', contract.endDate ? format(new Date(contract.endDate), 'dd MMMM yyyy', { locale: fr }) : 'Indéterminée'],
        ['Loyer Mensuel', `${contract.rentAmount.toLocaleString()} ${contract.currency}`],
        ['Garantie Locative', `${contract.depositAmount} Mois`],
        ['Type de Bail', getContractTypeLabel(contract.type)],
        ['Statut', contract.status.toUpperCase()],
        ['Charges', contract.chargesIncluded ? 'Incluses dans le loyer' : 'Non incluses']
      ],
      theme: 'striped',
      headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
      styles: { fontSize: 9 }
    });

    // Notes
    if (contract.notes) {
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      doc.setFontSize(12);
      doc.text('OBSERVATIONS PARTICULIERES', 20, finalY + 15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const splitNotes = doc.splitTextToSize(contract.notes, 170);
      doc.text(splitNotes, 20, finalY + 25);
    }

    // Signatures
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('POUR LE BAILLEUR', 40, pageHeight - 40);
    doc.text('POUR LE PRENEUR', 140, pageHeight - 40);
    
    doc.setFont('helvetica', 'normal');
    doc.text('(Signature précédée de la mention', 30, pageHeight - 30);
    doc.text('"Lu et Approuvé")', 45, pageHeight - 25);
    
    doc.text('(Signature précédée de la mention', 130, pageHeight - 30);
    doc.text('"Lu et Approuvé")', 145, pageHeight - 25);

    doc.save(`Contrat_${tenant?.name?.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('Document contractuel généré');
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground font-sans uppercase">Protocole Baux & B.I.</h2>
          <p className="text-muted-foreground font-medium italic">Administration légale du patrimoine et supervision des échéances.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setIsEditingContract(false); setEditingContractId(null); setSelectedCenterId(''); }
        }}>
          <DialogTrigger render={
            <Button 
                onClick={() => {
                  setNewContract({ tenantId: '', unitId: '', centerId: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', rentAmount: 0, depositAmount: 0, currency: 'USD', chargesIncluded: false, status: 'active', type: 'commercial', notes: '' });
                  setIsEditingContract(false);
                }}
                className="rounded-xl h-11 px-6 font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Rédaction d'Engagement
            </Button>
          } />
          <DialogContent className="sm:max-w-[750px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-primary p-6 text-primary-foreground">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tighter uppercase">
                   {isEditingContract ? 'Avenant au Titre Locatif' : 'Enregistrement Nouveau Bail'}
                </DialogTitle>
              </DialogHeader>
            </div>
            
            <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                    <User className="w-3 h-3 text-primary" /> Locataire (Preneur)
                  </Label>
                  <Select value={newContract.tenantId} onValueChange={(val) => setNewContract({...newContract, tenantId: val})}>
                    <SelectTrigger className="rounded-xl h-14 border-2 bg-muted/40 font-bold border-muted/50 focus:border-primary">
                      <SelectValue placeholder="Choisir le client" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id} className="font-bold py-3 uppercase tracking-tighter">
                           {t.name} (ID: {t.idNumber || 'N/A'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                    <Building2 className="w-3 h-3 text-primary" /> Centre Commercial
                  </Label>
                  <Select 
                    value={newContract.centerId}
                    onValueChange={(val) => {
                      setSelectedCenterId(val);
                      setNewContract({...newContract, centerId: val, unitId: ''});
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-14 border-2 bg-muted/40 font-bold border-muted/50 focus:border-primary">
                      <SelectValue placeholder="Affectation du centre" />
                    </SelectTrigger>
                    <SelectContent>
                      {centers.map(c => (
                        <SelectItem key={c.id} value={c.id} className="font-bold py-3 uppercase tracking-tighter">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                    <Home className="w-3 h-3 text-primary" /> Unité Locative Disponible
                  </Label>
                  <Select 
                    disabled={!selectedCenterId}
                    value={newContract.unitId}
                    onValueChange={(val) => setNewContract({...newContract, unitId: val})}
                  >
                    <SelectTrigger className="rounded-xl h-14 border-2 bg-muted/40 font-bold border-muted/50 focus:border-primary">
                      <SelectValue placeholder={selectedCenterId ? "Choisir l'unité" : "Activer un centre d'abord"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map(u => (
                        <SelectItem key={u.id} value={u.id} className="font-bold py-3 uppercase tracking-tighter">
                          {u.name} (T: {u.type} - F: {u.floor})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                    <Briefcase className="w-3 h-3 text-primary" /> Typologie de l'activité
                  </Label>
                  <Select value={newContract.type} onValueChange={(val: any) => setNewContract({...newContract, type: val})}>
                    <SelectTrigger className="rounded-xl h-14 border-2 bg-muted/40 font-bold border-muted/50 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial" className="font-bold uppercase py-2">Bail Commercial</SelectItem>
                      <SelectItem value="professional" className="font-bold uppercase py-2">Bail Professionnel</SelectItem>
                      <SelectItem value="residential" className="font-bold uppercase py-2">Bail Résidentiel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-8">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Date Effet</Label>
                  <Input 
                    type="date" 
                    value={newContract.startDate} 
                    onChange={(e) => setNewContract({...newContract, startDate: e.target.value})}
                    className="rounded-xl h-12 border-2 bg-muted/30 font-bold"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Échéance Terme</Label>
                  <Input 
                    type="date" 
                    value={newContract.endDate} 
                    onChange={(e) => setNewContract({...newContract, endDate: e.target.value})}
                    className="rounded-xl h-12 border-2 bg-muted/30 font-bold"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Loyer (Redevance)</Label>
                  <Input 
                    type="number" 
                    value={newContract.rentAmount} 
                    onChange={(e) => setNewContract({...newContract, rentAmount: parseFloat(e.target.value)})}
                    className="rounded-xl h-12 border-2 bg-muted/30 font-black text-primary"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Caution (Mois)</Label>
                  <Input 
                    type="number" 
                    value={newContract.depositAmount} 
                    onChange={(e) => setNewContract({...newContract, depositAmount: parseFloat(e.target.value)})}
                    className="rounded-xl h-12 border-2 bg-muted/30 font-black"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-5 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 shadow-sm transition-all hover:bg-primary/10">
                <Checkbox 
                  id="charges-inc" 
                  checked={newContract.chargesIncluded}
                  onCheckedChange={(val) => setNewContract({...newContract, chargesIncluded: !!val})}
                  className="w-6 h-6 rounded-md border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <div className="grid gap-0.5 leading-none">
                  <Label htmlFor="charges-inc" className="text-[11px] font-black uppercase tracking-tight text-foreground cursor-pointer flex items-center gap-2">
                    Inclusion des Charges Forfaitaires
                  </Label>
                  <p className="text-[10px] text-muted-foreground font-medium italic">Eau et électricité sont intégrées dans la redevance locative principale.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                 <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Monnaie Transactionnelle</Label>
                    <div className="flex gap-2">
                       <Button 
                        type="button" 
                        variant={newContract.currency === 'USD' ? 'default' : 'outline'}
                        onClick={() => setNewContract({...newContract, currency: 'USD'})}
                        className="flex-1 rounded-xl font-black h-12"
                       >USD ($)</Button>
                       <Button 
                        type="button" 
                        variant={newContract.currency === 'CDF' ? 'default' : 'outline'}
                        onClick={() => setNewContract({...newContract, currency: 'CDF'})}
                        className="flex-1 rounded-xl font-black h-12"
                       >CDF (FC)</Button>
                    </div>
                 </div>
                 <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">État du Contrat</Label>
                    <Select value={newContract.status} onValueChange={(val: any) => setNewContract({...newContract, status: val})}>
                      <SelectTrigger className="rounded-xl h-12 border-2 bg-muted/40 font-black tracking-widest text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="font-bold py-2">ACTIF EN VIGUEUR</SelectItem>
                        <SelectItem value="expired" className="font-bold py-2">EXPIRÉ / ÉCHU</SelectItem>
                        <SelectItem value="terminated" className="font-bold py-2 text-destructive">RÉSILIÉ / ANNULÉ</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="grid gap-4 border-t pt-8">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Stipulations & Observations</Label>
                  <textarea 
                    value={newContract.notes}
                    onChange={(e) => setNewContract({...newContract, notes: e.target.value})}
                    className="flex min-h-[100px] w-full rounded-2xl border-2 border-muted/30 bg-muted/20 px-4 py-3 text-sm focus:border-primary transition-all shadow-inner outline-none font-medium italic"
                    placeholder="Détails du renouvellement, clauses de révision, historique du dépôt..."
                  />
                </div>
              </div>
            </div>
            
            <div className="p-8 pt-0 flex gap-4">
              <Button variant="outline" className="flex-1 rounded-2xl h-14 font-black uppercase text-muted-foreground" onClick={() => setIsDialogOpen(false)}>Révoquer</Button>
              <Button onClick={handleSaveContract} className="flex-[2] rounded-2xl h-14 font-black shadow-xl shadow-primary/20 uppercase tracking-widest">
                {isEditingContract ? 'Entériner les modifications' : 'Ratifier le Contrat de Bail'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/20 p-4 rounded-3xl border border-muted/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par locataire ou unité physique..." 
            className="pl-12 h-12 rounded-2xl border-none bg-white shadow-sm ring-1 ring-black/5"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white/50 backdrop-blur-md">
        <Table>
          <TableHeader className="bg-muted/40 border-none">
            <TableRow className="border-none">
              <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8 py-4">Titre Locatif / Client</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Assiette Immobilière</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Exercice de Validité</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Redevance de Base</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">État de Conformité</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest pr-8 py-4">Opérations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.map((contract) => {
              const tenant = tenants.find(t => t.id === contract.tenantId);
              const unit = units.find(u => u.id === contract.unitId);
              const center = centers.find(c => c.id === contract.centerId);
              const isExpired = contract.endDate ? new Date(contract.endDate) < new Date() : false;
              
              return (
                <TableRow key={contract.id} className={cn(
                  "hover:bg-muted/10 border-none transition-colors border-b last:border-none",
                  contract.status === 'terminated' && "opacity-40 grayscale"
                )}>
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/20">
                         <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-lg tracking-tighter uppercase leading-none">{tenant?.name}</span>
                        <span className="text-[10px] font-black text-muted-foreground opacity-60 mt-1 uppercase tracking-tighter">Code Contrat: {String(contract.id).slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-black tracking-tight uppercase leading-none mb-1">{unit?.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-tighter italic italic">{center?.name} • Type: {getContractTypeLabel(contract.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground opacity-40" />
                        <span className="font-black text-[11px] uppercase tracking-widest opacity-80 italic italic">
                          {format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      {contract.endDate && (
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-tighter ml-6 opacity-40 underline decoration-muted-foreground/30",
                          isExpired && "text-destructive opacity-100 no-underline"
                        )}>
                          Terme: {format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-black text-xl tracking-tighter flex items-center gap-1">
                        {contract.rentAmount.toLocaleString()} <span className="text-[10px] font-bold opacity-30 italic">{contract.currency || '$'}</span>
                      </div>
                      {contract.depositAmount > 0 && (
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic bg-emerald-50 w-fit px-1.5 py-0.5 rounded-sm mt-1">Caution {contract.depositAmount} mois</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={Jt(
                        "rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest border-2 shadow-sm transition-all",
                        contract.status === 'active' ? (isExpired ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-emerald-500 text-white border-transparent') : 
                        'bg-gray-100 text-gray-700 border-gray-300'
                      )}
                    >
                      {contract.status === 'active' ? (isExpired ? 'Engagement Expiré' : 'Bail en Vigueur') : 
                       contract.status === 'expired' ? 'Échu' : 'Titre Résilié'}
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
                        <DropdownMenuItem onClick={() => openEditContract(contract)} className="rounded-xl cursor-pointer font-bold gap-3 py-2.5">
                          <Edit className="w-4 h-4 text-muted-foreground mr-2" /> Modifier Titre
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResiliate(contract.id, contract.unitId)} disabled={contract.status === 'terminated'} className="text-destructive rounded-xl cursor-pointer font-bold gap-3 py-2.5">
                          <Trash2 className="w-4 h-4 mr-2" /> Prononcer Résiliation
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => generateContractPDF(contract)} className="rounded-xl cursor-pointer font-bold gap-3 py-2.5 underline underline-offset-4 decoration-primary/20">
                          <Download className="w-4 h-4 mr-2" /> Édition PDF
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
