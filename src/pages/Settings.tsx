import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  ShieldCheck, 
  Bell, 
  User, 
  Trash2, 
  Upload, 
  Download,
  Check,
  X,
  Plus,
  AlertCircle,
  ToggleLeft,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '@/lib/db';
import { AppSettings } from '@/types';
import { toast } from 'sonner';
import { LocalStorageService } from '@/services/localStorageService';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog';

export default function Settings() {
  const settings = useLiveQuery(() => dbLocal.settings.get('global-settings')) || null;
  
  const [newStatus, setNewStatus] = useState({ id: '', label: '', color: 'bg-primary', isActive: true });
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  const handleUpdateFeature = async (featureKey: string, value: boolean) => {
    const currentSettings = settings || { id: 'global-settings', features: {} };
    const updatedSettings = {
      ...currentSettings,
      features: {
        ...(currentSettings.features || {}),
        [featureKey]: value
      }
    };
    await dbLocal.settings.put(updatedSettings as AppSettings);
    toast.success('Réglage mis à jour');
  };

  const handleSaveStatus = async () => {
    if (!newStatus.label) {
      toast.error('Le libellé est obligatoire');
      return;
    }
    if (!confirm(editingStatusId ? 'Confirmer la modification de ce statut ?' : 'Ajouter ce nouveau statut au système ?')) {
      return;
    }
    try {
      const currentSettings = settings || { id: 'global-settings', unitStatuses: [] };
      let updatedStatuses = [...(currentSettings.unitStatuses || [])];
      
      if (editingStatusId) {
        updatedStatuses = updatedStatuses.map(s => s.id === editingStatusId ? { ...newStatus, id: editingStatusId } : s);
        toast.success('Statut mis à jour');
      } else {
        const id = newStatus.label.toLowerCase().replace(/\s+/g, '-');
        if (updatedStatuses.some(s => s.id === id)) {
          toast.error('Un statut avec ce nom existe déjà');
          return;
        }
        updatedStatuses.push({ ...newStatus, id });
        toast.success('Nouveau statut ajouté');
      }
      
      await dbLocal.settings.put({ ...currentSettings, unitStatuses: updatedStatuses } as AppSettings);
      setIsStatusDialogOpen(false);
      setEditingStatusId(null);
      setNewStatus({ id: '', label: '', color: 'bg-primary', isActive: true });
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleToggleStatus = async (statusId: string) => {
    if (!confirm('Changer l\'état d\'activation de ce statut ?')) return;
    try {
      const currentSettings = settings;
      if (!currentSettings) return;
      
      const updatedStatuses = currentSettings.unitStatuses?.map(s => 
        s.id === statusId ? { ...s, isActive: !s.isActive } : s
      );
      
      await dbLocal.settings.put({ ...currentSettings, unitStatuses: updatedStatuses } as AppSettings);
      toast.success('Statut mis à jour');
    } catch (e) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    if (['free', 'occupied', 'maintenance'].includes(statusId)) {
      toast.error('Statut système obligatoire');
      return;
    }
    
    if (!confirm('Supprimer définitivement ce statut ? Les unités l\'utilisant pourraient rencontrer des erreurs d\'affichage.')) return;

    try {
      const currentSettings = settings;
      if (!currentSettings) return;
      
      const updatedStatuses = currentSettings.unitStatuses?.filter(s => s.id !== statusId);
      await dbLocal.settings.put({ ...currentSettings, unitStatuses: updatedStatuses } as AppSettings);
      toast.success('Statut supprimé');
    } catch (e) {
      toast.error('Erreur de suppression');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await LocalStorageService.exportBackup();
      saveAs(blob, `yetu-backup-${new Date().toISOString().split('T')[0]}.json`);
      toast.success('Sauvegarde exportée');
    } catch (error) {
      toast.error('Erreur lors de l\'exportation');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('AVERTISSEMENT: L\'importation écrasera TOUTES vos données actuelles. Procéder ?')) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await LocalStorageService.importBackup(content);
        toast.success('Sauvegarde restaurée');
        window.location.reload();
      } catch (error) {
        toast.error('Erreur lors de la restauration');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-3xl font-black tracking-tighter uppercase">Paramètres Système</h2>
        <p className="text-muted-foreground font-medium italic">Configuration globale et outils de maintenance de la plateforme GRACE.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-muted/20 p-1 rounded-2xl">
          <TabsTrigger value="general" className="rounded-xl font-bold gap-2 py-2 px-4">
            <SettingsIcon className="w-4 h-4" /> Général
          </TabsTrigger>
          <TabsTrigger value="units" className="rounded-xl font-bold gap-2 py-2 px-4">
            <Layout className="w-4 h-4" /> Unités
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl font-bold gap-2 py-2 px-4">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="ui" className="rounded-xl font-bold gap-2 py-2 px-4">
            <ToggleLeft className="w-4 h-4" /> Interface
          </TabsTrigger>
          <TabsTrigger value="backup" className="rounded-xl font-bold gap-2 py-2 px-4">
            <Database className="w-4 h-4" /> Données
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Modules du Noyau</CardTitle>
              <CardDescription>Activation des fonctionnalités critiques du système.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted/50 transition-all hover:bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-sm font-black uppercase tracking-tighter">Module de Maintenance</Label>
                  <p className="text-xs text-muted-foreground italic">Activer le suivi et la gestion des tickets de maintenance.</p>
                </div>
                <Checkbox 
                  checked={settings?.features?.enableMaintenanceTracking}
                  onCheckedChange={(val) => {
                    if (confirm('Modifier l\'état du module de maintenance ?')) {
                      handleUpdateFeature('enableMaintenanceTracking', !!val);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted/50 transition-all hover:bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-sm font-black uppercase tracking-tighter">Personnalisation des Statuts</Label>
                  <p className="text-xs text-muted-foreground italic">Autoriser la création de statuts d'unités personnalisés.</p>
                </div>
                <Checkbox 
                  checked={settings?.features?.allowCustomUnitStatuses}
                  onCheckedChange={(val) => {
                    if (confirm('Autoriser la personnalisation des statuts ?')) {
                      handleUpdateFeature('allowCustomUnitStatuses', !!val);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ui" className="space-y-6 mt-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Ajustements Visuels</CardTitle>
              <CardDescription>Préférences d'affichage et ergonomie logicielle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted/50 transition-all hover:bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-sm font-black uppercase tracking-tighter">Comptage de Statut sur les Centres</Label>
                  <p className="text-xs text-muted-foreground italic">Affiche le nombre d'unités par statut sur les cartes des centres.</p>
                </div>
                <Checkbox 
                  checked={settings?.features?.showUnitStatusCounts}
                  onCheckedChange={(val) => handleUpdateFeature('showUnitStatusCounts', !!val)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted/50 transition-all hover:bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-sm font-black uppercase tracking-tighter">Mode Compact (Tableaux)</Label>
                  <p className="text-xs text-muted-foreground italic">Réduit l'espacement pour afficher plus de données à l'écran.</p>
                </div>
                <Checkbox 
                  checked={settings?.features?.compactMode}
                  onCheckedChange={(val) => handleUpdateFeature('compactMode', !!val)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Flux de Notifications</CardTitle>
              <CardDescription>Gérez la manière dont le système communique les alertes critiques.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted/50">
                <div className="space-y-1">
                  <Label className="text-sm font-black uppercase tracking-tighter">Alertes par Email (Contrats)</Label>
                  <p className="text-xs text-muted-foreground italic">Recevoir un rappel 15 jours avant l'échéance d'un bail.</p>
                </div>
                <Checkbox defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted/50">
                <div className="space-y-1">
                  <Label className="text-sm font-black uppercase tracking-tighter">Notifications de Paiement</Label>
                  <p className="text-xs text-muted-foreground italic">Alerte système lors de l'enregistrement d'une quittance.</p>
                </div>
                <Checkbox defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted/50">
                <div className="space-y-1">
                  <Label className="text-sm font-black uppercase tracking-tighter">Rapports d'Activité Hebdomadaires</Label>
                  <p className="text-xs text-muted-foreground italic">Envoi automatique du résumé financier chaque lundi matin.</p>
                </div>
                <Checkbox />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-6 mt-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/10">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Gestion des Statuts d'Unité</CardTitle>
                <CardDescription>Configurez les états possibles pour vos boutiques et bureaux.</CardDescription>
              </div>
              <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <DialogTrigger render={
                  <Button className="rounded-xl font-black px-6 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 mr-2" /> Nouveau Statut
                  </Button>
                } />
                <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                  <div className="bg-primary p-6 text-primary-foreground">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black">Configurateur de Statut</DialogTitle>
                    </DialogHeader>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="grid gap-2">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Libellé du statut</Label>
                      <Input 
                        value={newStatus.label} 
                        onChange={(e) => setNewStatus({...newStatus, label: e.target.value})}
                        placeholder="ex: En Rénovation"
                        className="rounded-xl h-12 border-2"
                      />
                    </div>
                    <div className="grid gap-2">
                       <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Couleur Identitaire</Label>
                       <div className="flex gap-2">
                          {['bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-blue-500', 'bg-primary', 'bg-slate-500'].map(c => (
                            <button 
                              key={c}
                              onClick={() => setNewStatus({...newStatus, color: c})}
                              className={cn(
                                "w-10 h-10 rounded-full border-4 transition-all",
                                c,
                                newStatus.color === c ? "border-white shadow-lg scale-110" : "border-transparent opacity-60"
                              )}
                            />
                          ))}
                       </div>
                    </div>
                  </div>
                  <DialogFooter className="p-8 pt-0">
                    <Button variant="outline" className="rounded-xl h-12 flex-1" onClick={() => setIsStatusDialogOpen(false)}>Révoquer</Button>
                    <Button onClick={handleSaveStatus} className="rounded-xl h-12 flex-[2] font-black uppercase shadow-lg shadow-primary/20">Enregistrer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-muted/30">
                  {settings?.unitStatuses?.map((status) => (
                    <div key={status.id} className="flex items-center justify-between p-6 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-4 h-4 rounded-full", status.color)} />
                        <div>
                          <p className="font-black uppercase tracking-tight">{status.label}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-60">ID: {status.id}</p>
                        </div>
                        {!status.isActive && <Badge variant="secondary" className="text-[8px] font-black uppercase px-2 py-0">Désactivé</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full w-10 h-10"
                          onClick={() => handleToggleStatus(status.id)}
                        >
                          {status.isActive ? <X className="w-4 h-4 text-rose-500" /> : <Check className="w-4 h-4 text-emerald-500" />}
                        </Button>
                        {!['free', 'occupied', 'maintenance'].includes(status.id) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full w-10 h-10 text-destructive"
                            onClick={() => handleDeleteStatus(status.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6 mt-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-gradient-to-br from-white to-primary/5">
             <CardHeader>
               <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                 <ShieldCheck className="w-6 h-6 text-primary" /> Intégrité des Données
               </CardTitle>
               <CardDescription>Exportez, restaurez ou réinitialisez la base de données locale.</CardDescription>
             </CardHeader>
             <CardContent className="grid md:grid-cols-2 gap-6 pb-12">
                <div className="p-6 rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5 space-y-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Download className="w-6 h-6" />
                  </div>
                  <h3 className="font-black uppercase text-sm">Sauvegarde Stratégique</h3>
                  <p className="text-xs text-muted-foreground italic">Générez un fichier JSON contenant l'intégralité de vos centres, contrats et flux financiers.</p>
                  <Button onClick={handleExport} className="w-full rounded-xl font-black uppercase py-6 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">Exporter les archives</Button>
                </div>

                <div className="p-6 rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5 space-y-4 relative">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="font-black uppercase text-sm">Restauration du Système</h3>
                  <p className="text-xs text-muted-foreground italic">Réinjectez une sauvegarde précédente pour restaurer un état antérieur de votre patrimoine.</p>
                  <Button className="w-full rounded-xl font-black uppercase py-6 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 overflow-hidden relative">
                    Importer un point de restauration
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImport} 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </Button>
                </div>
             </CardContent>
             <CardFooter className="bg-rose-50 p-8 border-t border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                  <div className="flex flex-col">
                    <p className="text-xs font-black text-rose-700 uppercase">Zone de Danger</p>
                    <p className="text-[10px] text-rose-600 italic">Ces actions sont irréversibles et impactent l'audit local.</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  className="rounded-xl font-black uppercase bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-600/20"
                  onClick={async () => {
                    if (confirm('DANGER: Êtes-vous ABSOLUMENT certain de vouloir effacer TOUTES les données ? Un audit externe sera impossible sans sauvegarde.')) {
                      await LocalStorageService.wipeDatabase();
                      window.location.reload();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Effacement Définitif
                </Button>
             </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
