import React, { useEffect, useState } from 'react';
import { Plus, Building2, MapPin, MoreVertical, Edit, Trash2, Home, Search, LayoutGrid } from 'lucide-react';
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
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../lib/db';
import { DataService } from '../lib/data';
import { Center, Building, Unit } from '../types';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';

import { cn } from '../lib/utils';

export default function Centers() {
  const data = useLiveQuery(async () => {
    return {
      centers: await dbLocal.centers.toArray(),
      buildings: await dbLocal.buildings.toArray(),
      units: await dbLocal.units.toArray(),
    };
  }) || { centers: [], buildings: [], units: [] };

  const { centers, buildings, units } = data;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCenterDialogOpen, setIsCenterDialogOpen] = useState(false);
  const [isBuildingDialogOpen, setIsBuildingDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: any, type: 'centers' | 'buildings' | 'units', name: string} | null>(null);
  
  const [editingItem, setEditingItem] = useState<{id: any, type: 'centers' | 'buildings' | 'units'} | null>(null);

  const [newCenter, setNewCenter] = useState({ name: '', location: '', description: '' });
  const [newBuilding, setNewBuilding] = useState({ centerId: '', name: '', description: '' });
  const [newUnit, setNewUnit] = useState({ 
    centerId: '', 
    buildingId: '', 
    name: '', 
    type: 'shop' as const, 
    status: 'free' as const, 
    floor: '' 
  });

  const handleSaveCenter = async () => {
    if (!newCenter.name) {
      toast.error('Le nom du centre est obligatoire');
      return;
    }
    try {
      if (editingItem && editingItem.type === 'centers') {
        await DataService.update('centers', editingItem.id, newCenter);
        toast.success('Centre commercial mis à jour');
      } else {
        await DataService.add('centers', { ...newCenter, createdAt: new Date().toISOString() });
        toast.success('Centre commercial ajouté avec succès');
      }
      setNewCenter({ name: '', location: '', description: '' });
      setEditingItem(null);
      setIsCenterDialogOpen(false);
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleSaveBuilding = async () => {
    if (!newBuilding.name || !newBuilding.centerId) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    try {
      if (editingItem && editingItem.type === 'buildings') {
        await DataService.update('buildings', editingItem.id, newBuilding);
        toast.success('Immeuble mis à jour');
      } else {
        await DataService.add('buildings', newBuilding);
        toast.success('Immeuble ajouté avec succès');
      }
      setNewBuilding({ centerId: '', name: '', description: '' });
      setEditingItem(null);
      setIsBuildingDialogOpen(false);
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleSaveUnit = async () => {
    if (!newUnit.name || !newUnit.centerId || !newUnit.buildingId) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    try {
      if (editingItem && editingItem.type === 'units') {
        await DataService.update('units', editingItem.id, newUnit);
        toast.success('Unité mise à jour');
      } else {
        await DataService.add('units', newUnit);
        toast.success('Unité ajoutée avec succès');
      }
      setNewUnit({ 
        centerId: '', 
        buildingId: '', 
        name: '', 
        type: 'shop', 
        status: 'free', 
        floor: '' 
      });
      setEditingItem(null);
      setIsUnitDialogOpen(false);
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const openEditCenter = (center: Center) => {
    setEditingItem({ id: center.id, type: 'centers' });
    setNewCenter({ name: center.name, location: center.location, description: center.description || '' });
    setIsCenterDialogOpen(true);
  };

  const openEditBuilding = (building: Building) => {
    setEditingItem({ id: building.id, type: 'buildings' });
    setNewBuilding({ centerId: building.centerId, name: building.name, description: building.description || '' });
    setIsBuildingDialogOpen(true);
  };

  const openEditUnit = (unit: Unit) => {
    setEditingItem({ id: unit.id, type: 'units' });
    setNewUnit({ 
      centerId: unit.centerId, 
      buildingId: unit.buildingId, 
      name: unit.name, 
      type: unit.type, 
      status: unit.status, 
      floor: unit.floor 
    });
    setIsUnitDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'centers') {
        // Cascade delete buildings and units
        const buildingIds = (await dbLocal.buildings.where('centerId').equals(itemToDelete.id).toArray()).map(b => b.id);
        await dbLocal.buildings.where('centerId').equals(itemToDelete.id).delete();
        await dbLocal.units.where('centerId').equals(itemToDelete.id).delete();
      } else if (itemToDelete.type === 'buildings') {
        // Cascade delete units
        await dbLocal.units.where('buildingId').equals(itemToDelete.id).delete();
      }

      await DataService.delete(itemToDelete.type, itemToDelete.id);
      toast.success(`${itemToDelete.name} supprimé avec succès`);
      setItemToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredCenters = centers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBuildings = buildings.filter(b => {
    const center = centers.find(c => c.id === b.centerId);
    return b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           center?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredUnits = units.filter(u => {
    const building = buildings.find(b => b.id === u.buildingId);
    const center = centers.find(c => c.id === u.centerId);
    return u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           building?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           center?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground">Gestion des Biens</h2>
          <p className="text-muted-foreground font-medium">Architecture immobilière : Centres, Immeubles & Unités.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Dialog open={isBuildingDialogOpen} onOpenChange={(open) => {
            setIsBuildingDialogOpen(open);
            if (!open) { setEditingItem(null); setNewBuilding({ centerId: '', name: '', description: '' }); }
          }}>
            <DialogTrigger render={
              <Button variant="outline" className="rounded-xl border-2 hover:bg-muted font-bold transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Immeuble
              </Button>
            } />
            <DialogContent className="rounded-3xl border-none shadow-2xl overflow-hidden max-w-[450px] p-0">
              <div className="bg-primary p-6 text-primary-foreground">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">{editingItem ? 'Modifier l\'Immeuble' : 'Nouvel Immeuble'}</DialogTitle>
                </DialogHeader>
              </div>
              <div className="grid gap-6 p-8">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Centre Commercial d'affectation</Label>
                  <Select 
                    value={newBuilding.centerId} 
                    onValueChange={(val) => setNewBuilding({...newBuilding, centerId: val})}
                  >
                    <SelectTrigger className="rounded-xl h-12 border-2 bg-muted/30 focus:border-primary transition-all">
                      <SelectValue placeholder="Sélectionner un centre" />
                    </SelectTrigger>
                    <SelectContent>
                      {centers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="b-name" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Désignation de l'immeuble</Label>
                  <Input 
                    id="b-name" 
                    value={newBuilding.name} 
                    onChange={(e) => setNewBuilding({...newBuilding, name: e.target.value})} 
                    placeholder="ex: Bloc A, Aile Ouest..."
                    className="rounded-xl h-12 border-2 bg-muted/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="b-desc" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Description technique</Label>
                  <Input 
                    id="b-desc" 
                    value={newBuilding.description} 
                    onChange={(e) => setNewBuilding({...newBuilding, description: e.target.value})} 
                    className="rounded-xl h-12 border-2 bg-muted/30 focus:border-primary transition-all"
                    placeholder="Détails, code bâtiment..."
                  />
                </div>
              </div>
              <div className="p-8 pt-0 flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setIsBuildingDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSaveBuilding} className="flex-1 rounded-xl h-12 font-black shadow-lg shadow-primary/20 transition-all active:scale-95">
                  {editingItem ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isUnitDialogOpen} onOpenChange={(open) => {
            setIsUnitDialogOpen(open);
            if (!open) { 
              setEditingItem(null); 
              setNewUnit({ centerId: '', buildingId: '', name: '', type: 'shop', status: 'free', floor: '' }); 
            }
          }}>
            <DialogTrigger render={
              <Button variant="outline" className="rounded-xl border-2 hover:bg-muted font-bold transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Unité
              </Button>
            } />
            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-[500px]">
              <div className="bg-primary p-6 text-primary-foreground">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">{editingItem ? 'Modifier l\'Unité' : 'Nouvelle Unité Locative'}</DialogTitle>
                </DialogHeader>
              </div>
              <div className="grid gap-6 p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Centre</Label>
                    <Select 
                      value={newUnit.centerId}
                      onValueChange={(val) => {
                        setNewUnit({...newUnit, centerId: val, buildingId: ''});
                      }}
                    >
                      <SelectTrigger className="rounded-xl h-12 border-2 bg-muted/30">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {centers.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Immeuble</Label>
                    <Select 
                      disabled={!newUnit.centerId}
                      value={newUnit.buildingId}
                      onValueChange={(val) => setNewUnit({...newUnit, buildingId: val})}
                    >
                      <SelectTrigger className="rounded-xl h-12 border-2 bg-muted/30">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.filter(b => b.centerId === newUnit.centerId).map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="u-name" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Identifiant Unité</Label>
                    <Input 
                      id="u-name" 
                      value={newUnit.name} 
                      onChange={(e) => setNewUnit({...newUnit, name: e.target.value})} 
                      placeholder="ex: B-01"
                      className="rounded-xl h-12 border-2 bg-muted/30"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="u-floor" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Emplacement / Étage</Label>
                    <Input 
                      id="u-floor" 
                      value={newUnit.floor} 
                      onChange={(e) => setNewUnit({...newUnit, floor: e.target.value})} 
                      placeholder="ex: RDC, Niveau 1"
                      className="rounded-xl h-12 border-2 bg-muted/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Type</Label>
                    <Select value={newUnit.type} onValueChange={(val: any) => setNewUnit({...newUnit, type: val})}>
                      <SelectTrigger className="rounded-xl h-12 border-2 bg-muted/30 uppercase font-black text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shop">MAGASIN / BOUTIQUE</SelectItem>
                        <SelectItem value="office">BUREAU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Statut</Label>
                    <Select value={newUnit.status} onValueChange={(val: any) => setNewUnit({...newUnit, status: val})}>
                      <SelectTrigger className="rounded-xl h-12 border-2 bg-muted/30 uppercase font-black text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">LIBRE</SelectItem>
                        <SelectItem value="occupied">OCCUPÉ</SelectItem>
                        <SelectItem value="maintenance">MAINTENANCE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="p-8 pt-0 flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setIsUnitDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSaveUnit} className="flex-1 rounded-xl h-12 font-black shadow-lg shadow-primary/20">
                  {editingItem ? 'Mettre à jour' : 'Enregistrer Unité'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCenterDialogOpen} onOpenChange={(open) => {
            setIsCenterDialogOpen(open);
            if (!open) { setEditingItem(null); setNewCenter({ name: '', location: '', description: '' }); }
          }}>
            <DialogTrigger render={
              <Button className="rounded-xl shadow-lg shadow-primary/20 font-black h-11 px-6 active:scale-95 transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Centre
              </Button>
            } />
            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-[450px]">
              <div className="bg-primary p-6 text-primary-foreground flex justify-between items-center">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">{editingItem ? 'Détails du Centre' : 'Nouveau Centre Commercial'}</DialogTitle>
                </DialogHeader>
              </div>
              <div className="grid gap-6 p-8">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Dénomination Sociale</Label>
                  <Input 
                    id="name" 
                    value={newCenter.name} 
                    onChange={(e) => setNewCenter({...newCenter, name: e.target.value})} 
                    placeholder="ex: Centre Galeries Yetu"
                    className="rounded-xl h-12 border-2 bg-muted/30 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Adresse / Localisation</Label>
                  <Input 
                    id="location" 
                    value={newCenter.location} 
                    onChange={(e) => setNewCenter({...newCenter, location: e.target.value})} 
                    placeholder="ex: Av. de la Libération, Kinshasa"
                    className="rounded-xl h-12 border-2 bg-muted/30 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Observations</Label>
                  <Input 
                    id="description" 
                    value={newCenter.description} 
                    onChange={(e) => setNewCenter({...newCenter, description: e.target.value})} 
                    placeholder="Notes additionnelles..."
                    className="rounded-xl h-12 border-2 bg-muted/30 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div className="p-8 pt-0 flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setIsCenterDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSaveCenter} className="flex-1 rounded-xl h-12 font-black shadow-lg shadow-primary/20">
                  {editingItem ? 'Confirmer' : 'Créer le Centre'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/20 p-4 rounded-3xl border border-muted/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher à travers le patrimoine..." 
            className="pl-12 h-12 rounded-2xl border-none bg-white shadow-sm ring-1 ring-black/5"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-white/50 rounded-2xl shadow-inner border w-full md:w-auto">
          <Badge variant="ghost" className="rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-tighter">Filtre Actif: Aucun</Badge>
        </div>
      </div>

      <Tabs defaultValue="centers" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="centers">Centres</TabsTrigger>
          <TabsTrigger value="buildings">Immeubles</TabsTrigger>
          <TabsTrigger value="units">Unités</TabsTrigger>
        </TabsList>

        <TabsContent value="centers" className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCenters.map((center) => (
              <Card key={center.id} className="overflow-hidden border-none shadow-lg shadow-black/5 rounded-3xl group hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Building2 className="w-6 h-6 text-primary group-hover:text-white" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2">
                        <DropdownMenuItem onClick={() => openEditCenter(center)} className="rounded-xl cursor-pointer">
                          <Edit className="w-4 h-4 mr-3 text-muted-foreground" /> <span className="font-bold">Modifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive rounded-xl cursor-pointer" onClick={() => {
                          setItemToDelete({ id: center.id, type: 'centers', name: center.name });
                          setIsConfirmOpen(true);
                        }}>
                          <Trash2 className="w-4 h-4 mr-3" /> <span className="font-bold">Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="mt-4 text-2xl font-black tracking-tighter uppercase">{center.name}</CardTitle>
                  <div className="flex items-center text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest italic opacity-70">
                    <MapPin className="w-3 h-3 mr-1" />
                    {center.location}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Immeubles</span>
                    <span className="font-black text-primary">{buildings.filter(b => b.centerId === center.id).length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Unités en gestion</span>
                    <span className="font-black text-primary">{units.filter(u => u.centerId === center.id).length}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {centers.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">Aucun centre commercial enregistré.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="buildings" className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden p-0">
            <Table>
              <TableHeader className="bg-muted/50 border-none">
                <TableRow className="border-none">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">Désignation</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Centre Affilié</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Unités</TableHead>
                  <TableHead className="text-right font-black text-[10px] uppercase tracking-widest pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuildings.map((building) => (
                  <TableRow key={building.id} className="hover:bg-muted/10 border-none transition-colors">
                    <TableCell className="font-black text-lg py-6 pl-8 tracking-tighter">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {building.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-xl px-4 py-1.5 font-bold uppercase tracking-tighter bg-white shadow-sm italic opacity-80 border-muted">
                        {centers.find(c => c.id === building.centerId)?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-black text-xl text-primary">{units.filter(u => u.buildingId === building.id).length}</TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-10 h-10 rounded-xl hover:bg-primary hover:text-white transition-all active:scale-90"
                          onClick={() => openEditBuilding(building)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive w-10 h-10 rounded-xl hover:bg-destructive hover:text-white transition-all active:scale-90" 
                          onClick={() => {
                            setItemToDelete({ id: building.id, type: 'buildings', name: building.name });
                            setIsConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {buildings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun immeuble enregistré.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="mt-6 animate-in slide-in-from-bottom-2 duration-300">
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden p-0">
            <Table>
              <TableHeader className="bg-muted/50 border-none">
                <TableRow className="border-none">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">Unité Locative</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Localisation</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Type</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Statut</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Étage</TableHead>
                  <TableHead className="text-right font-black text-[10px] uppercase tracking-widest pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit) => (
                  <TableRow key={unit.id} className="hover:bg-muted/10 border-none transition-colors">
                    <TableCell className="font-black text-lg py-6 pl-8 tracking-tighter">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center bg-muted/50 text-muted-foreground shadow-sm",
                          unit.status === 'occupied' && "bg-primary/20 text-primary"
                        )}>
                          <Home className="w-5 h-5" />
                        </div>
                        {unit.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tighter">{buildings.find(b => b.id === unit.buildingId)?.name}</span>
                        <span className="text-[10px] uppercase font-black opacity-50">{centers.find(c => c.id === unit.centerId)?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-black uppercase tracking-widest italic">{unit.type === 'shop' ? 'Boutique/Magasin' : 'Bureau/S. Office'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm",
                        unit.status === 'occupied' ? "bg-emerald-500 text-white border-none" : 
                        unit.status === 'free' ? "bg-amber-50 text-amber-600 border-amber-200" : 
                        "bg-destructive text-white border-none"
                      )}>
                        {unit.status === 'occupied' ? 'Occupé' : 
                         unit.status === 'free' ? 'Libre' : 'Maint.'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold italic text-muted-foreground">{unit.floor || '-'}</TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-10 h-10 rounded-xl hover:bg-primary hover:text-white transition-all active:scale-90"
                          onClick={() => openEditUnit(unit)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive w-10 h-10 rounded-xl hover:bg-destructive hover:text-white transition-all active:scale-90" 
                          onClick={() => {
                            setItemToDelete({ id: unit.id, type: 'units', name: unit.name });
                            setIsConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {units.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune unité enregistrée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog 
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={`Supprimer ${itemToDelete?.name || 'l\'élément'}`}
        description={
          itemToDelete?.type === 'centers' 
            ? "Attention: Supprimer ce centre supprimera également tous les immeubles et toutes les unités qui lui sont rattachés. Cette action est irréversible."
            : itemToDelete?.type === 'buildings'
            ? "Attention: Supprimer cet immeuble supprimera également toutes les unités qui lui sont rattachées. Cette action est irréversible."
            : "Êtes-vous sûr de vouloir supprimer cette unité ? Cette action est irréversible."
        }
        onConfirm={handleDeleteItem}
      />
    </div>
  );
}
