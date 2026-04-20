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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: any, type: 'centers' | 'buildings' | 'units', name: string} | null>(null);
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

  const [isBuildingDialogOpen, setIsBuildingDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);

  const handleAddCenter = async () => {
    if (!newCenter.name) {
      toast.error('Le nom du centre est obligatoire');
      return;
    }
    try {
      await DataService.add('centers', { ...newCenter, createdAt: new Date().toISOString() });
      setNewCenter({ name: '', location: '', description: '' });
      setIsCenterDialogOpen(false);
      toast.success('Centre commercial ajouté avec succès (Local-First)');
    } catch (e) {
      toast.error('Erreur lors de l\'ajout du centre');
    }
  };

  const handleAddBuilding = async () => {
    if (!newBuilding.name || !newBuilding.centerId) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    try {
      await DataService.add('buildings', newBuilding);
      setNewBuilding({ centerId: '', name: '', description: '' });
      setIsBuildingDialogOpen(false);
      toast.success('Immeuble ajouté avec succès');
    } catch (e) {
      toast.error('Erreur lors de l\'ajout de l\'immeuble');
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.name || !newUnit.centerId || !newUnit.buildingId) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    try {
      await DataService.add('units', newUnit);
      setNewUnit({ 
        centerId: '', 
        buildingId: '', 
        name: '', 
        type: 'shop', 
        status: 'free', 
        floor: '' 
      });
      setIsUnitDialogOpen(false);
      toast.success('Unité ajoutée avec succès');
    } catch (e) {
      toast.error('Erreur lors de l\'ajout de l\'unité');
    }
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Biens</h2>
          <p className="text-muted-foreground">Gérez vos centres commerciaux, immeubles et unités locatives.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBuildingDialogOpen} onOpenChange={setIsBuildingDialogOpen}>
            <DialogTrigger render={
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Immeuble
              </Button>
            } />
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Ajouter un Immeuble</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Centre Commercial</Label>
                  <Select onValueChange={(val) => setNewBuilding({...newBuilding, centerId: val})}>
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
                <div className="grid gap-2">
                  <Label htmlFor="b-name">Nom de l'immeuble</Label>
                  <Input 
                    id="b-name" 
                    value={newBuilding.name} 
                    onChange={(e) => setNewBuilding({...newBuilding, name: e.target.value})} 
                    placeholder="ex: Bloc A"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="b-desc">Description</Label>
                  <Input 
                    id="b-desc" 
                    value={newBuilding.description} 
                    onChange={(e) => setNewBuilding({...newBuilding, description: e.target.value})} 
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddBuilding} className="rounded-xl">Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
            <DialogTrigger render={
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Unité
              </Button>
            } />
            <DialogContent className="rounded-3xl sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Ajouter une Unité Locative</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Centre</Label>
                    <Select onValueChange={(val) => {
                      setNewUnit({...newUnit, centerId: val, buildingId: ''});
                    }}>
                      <SelectTrigger className="rounded-xl">
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
                    <Label>Immeuble</Label>
                    <Select 
                      disabled={!newUnit.centerId}
                      onValueChange={(val) => setNewUnit({...newUnit, buildingId: val})}
                    >
                      <SelectTrigger className="rounded-xl">
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
                    <Label htmlFor="u-name">Nom/Numéro Unité</Label>
                    <Input 
                      id="u-name" 
                      value={newUnit.name} 
                      onChange={(e) => setNewUnit({...newUnit, name: e.target.value})} 
                      placeholder="ex: Boutique 01"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="u-floor">Étage</Label>
                    <Input 
                      id="u-floor" 
                      value={newUnit.floor} 
                      onChange={(e) => setNewUnit({...newUnit, floor: e.target.value})} 
                      placeholder="ex: RDC, 1er..."
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Type d'unité</Label>
                    <Select value={newUnit.type} onValueChange={(val: any) => setNewUnit({...newUnit, type: val})}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shop">Magasin / Boutique</SelectItem>
                        <SelectItem value="office">Bureau</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Statut initial</Label>
                    <Select value={newUnit.status} onValueChange={(val: any) => setNewUnit({...newUnit, status: val})}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Libre</SelectItem>
                        <SelectItem value="occupied">Occupé</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddUnit} className="rounded-xl">Enregistrer l'unité</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCenterDialogOpen} onOpenChange={setIsCenterDialogOpen}>
            <DialogTrigger render={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Centre
              </Button>
            } />
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Ajouter un Centre Commercial</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom du centre</Label>
                  <Input 
                    id="name" 
                    value={newCenter.name} 
                    onChange={(e) => setNewCenter({...newCenter, name: e.target.value})} 
                    placeholder="ex: Centre Ville"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input 
                    id="location" 
                    value={newCenter.location} 
                    onChange={(e) => setNewCenter({...newCenter, location: e.target.value})} 
                    placeholder="ex: Gombe, Kinshasa"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optionnel)</Label>
                  <Input 
                    id="description" 
                    value={newCenter.description} 
                    onChange={(e) => setNewCenter({...newCenter, description: e.target.value})} 
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCenter} className="rounded-xl">Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par nom, localisation ou immeuble..." 
            className="pl-10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="centers" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="centers">Centres</TabsTrigger>
          <TabsTrigger value="buildings">Immeubles</TabsTrigger>
          <TabsTrigger value="units">Unités</TabsTrigger>
        </TabsList>

        <TabsContent value="centers" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCenters.map((center) => (
              <Card key={center.id} className="overflow-hidden group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => {
                          setItemToDelete({ id: center.id, type: 'centers', name: center.name });
                          setIsConfirmOpen(true);
                        }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="mt-4">{center.name}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {center.location}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Immeubles:</span>
                    <span className="font-medium">{buildings.filter(b => b.centerId === center.id).length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-muted-foreground">Unités totales:</span>
                    <span className="font-medium">{units.filter(u => u.centerId === center.id).length}</span>
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

        <TabsContent value="buildings" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de l'immeuble</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Unités</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuildings.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell className="font-medium">{building.name}</TableCell>
                    <TableCell>{centers.find(c => c.id === building.centerId)?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{building.description}</TableCell>
                    <TableCell>{units.filter(u => u.buildingId === building.id).length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                          setItemToDelete({ id: building.id, type: 'buildings', name: building.name });
                          setIsConfirmOpen(true);
                        }}>
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

        <TabsContent value="units" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unité</TableHead>
                  <TableHead>Immeuble</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Étage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        {unit.name}
                      </div>
                    </TableCell>
                    <TableCell>{buildings.find(b => b.id === unit.buildingId)?.name}</TableCell>
                    <TableCell className="capitalize">{unit.type}</TableCell>
                    <TableCell>
                      <Badge variant={
                        unit.status === 'occupied' ? 'default' : 
                        unit.status === 'free' ? 'secondary' : 'destructive'
                      }>
                        {unit.status === 'occupied' ? 'Occupé' : 
                         unit.status === 'free' ? 'Libre' : 'Maintenance'}
                      </Badge>
                    </TableCell>
                    <TableCell>{unit.floor}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                          setItemToDelete({ id: unit.id, type: 'units', name: unit.name });
                          setIsConfirmOpen(true);
                        }}>
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
