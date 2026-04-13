import React, { useEffect, useState } from 'react';
import { Plus, Building2, MapPin, MoreVertical, Edit, Trash2, Home } from 'lucide-react';
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
import { subscribeCollection, addDocument, updateDocument, deleteDocument } from '../lib/firestore';
import { Center, Building, Unit } from '../types';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Centers() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  const [isCenterDialogOpen, setIsCenterDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'centers' | 'buildings' | 'units'} | null>(null);
  const [newCenter, setNewCenter] = useState({ name: '', location: '', description: '' });

  useEffect(() => {
    const unsubCenters = subscribeCollection<Center>('centers', setCenters);
    const unsubBuildings = subscribeCollection<Building>('buildings', setBuildings);
    const unsubUnits = subscribeCollection<Unit>('units', setUnits);
    
    return () => {
      unsubCenters();
      unsubBuildings();
      unsubUnits();
    };
  }, []);

  const handleAddCenter = async () => {
    if (!newCenter.name) {
      toast.error('Le nom du centre est obligatoire');
      return;
    }
    try {
      await addDocument('centers', { ...newCenter, createdAt: new Date().toISOString() });
      setNewCenter({ name: '', location: '', description: '' });
      setIsCenterDialogOpen(false);
      toast.success('Centre commercial ajouté avec succès');
    } catch (e) {
      toast.error('Erreur lors de l\'ajout du centre');
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDocument(itemToDelete.type, itemToDelete.id);
      toast.success('Élément supprimé avec succès');
      setItemToDelete(null);
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Biens</h2>
          <p className="text-muted-foreground">Gérez vos centres commerciaux, immeubles et unités locatives.</p>
        </div>
        
        <Dialog open={isCenterDialogOpen} onOpenChange={setIsCenterDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Centre
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Localisation</Label>
                <Input 
                  id="location" 
                  value={newCenter.location} 
                  onChange={(e) => setNewCenter({...newCenter, location: e.target.value})} 
                  placeholder="ex: Gombe, Kinshasa"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optionnel)</Label>
                <Input 
                  id="description" 
                  value={newCenter.description} 
                  onChange={(e) => setNewCenter({...newCenter, description: e.target.value})} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddCenter}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="centers" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="centers">Centres</TabsTrigger>
          <TabsTrigger value="buildings">Immeubles</TabsTrigger>
          <TabsTrigger value="units">Unités</TabsTrigger>
        </TabsList>

        <TabsContent value="centers" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {centers.map((center) => (
              <Card key={center.id} className="overflow-hidden group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => {
                          setItemToDelete({ id: center.id, type: 'centers' });
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
                {buildings.map((building) => (
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
                          setItemToDelete({ id: building.id, type: 'buildings' });
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
                {units.map((unit) => (
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
                          setItemToDelete({ id: unit.id, type: 'units' });
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
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action supprimera également toutes les données liées."
        onConfirm={handleDeleteItem}
      />
    </div>
  );
}
