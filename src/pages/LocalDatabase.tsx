import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileJson,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { dbLocal } from '@/lib/db';
import { LocalStorageService } from '@/services/localStorageService';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { getCollection } from '@/lib/firestore';
import { useAppStore } from '@/store/useAppStore';

const LocalDatabase = () => {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const { lastSync, setLastSync } = useAppStore();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const tables = ['centers', 'buildings', 'units', 'tenants', 'contracts', 'invoices', 'payments', 'expenses'];
    const newStats: Record<string, number> = {};
    for (const table of tables) {
      newStats[table] = await (dbLocal as any)[table].count();
    }
    setStats(newStats);
  };

  const handleExport = async () => {
    try {
      const blob = await LocalStorageService.exportBackup();
      saveAs(blob, `yetu-backup-${new Date().toISOString().split('T')[0]}.json`);
      toast.success('Sauvegarde exportée avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'exportation');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await LocalStorageService.importBackup(content);
        await loadStats();
        toast.success('Sauvegarde restaurée avec succès');
      } catch (error) {
        toast.error('Erreur lors de la restauration');
      }
    };
    reader.readAsText(file);
  };

  const handleWipe = async () => {
    if (confirm('Êtes-vous sûr de vouloir effacer TOUTES les données locales ? Cette action est irréversible.')) {
      try {
        await LocalStorageService.wipeDatabase();
        await loadStats();
        toast.success('Base de données locale effacée');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleSyncFromCloud = async () => {
    setIsSyncing(true);
    try {
      const collections = ['centers', 'buildings', 'units', 'tenants', 'contracts', 'invoices', 'payments', 'expenses'];
      
      for (const col of collections) {
        const data = await getCollection(col);
        await (dbLocal as any)[col].clear();
        if (data.length > 0) {
          await (dbLocal as any)[col].bulkAdd(data);
        }
      }
      
      setLastSync(Date.now());
      await loadStats();
      toast.success('Données synchronisées depuis le cloud');
    } catch (error) {
      console.error(error);
      toast.error('Échec de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  const totalEntries = Object.values(stats).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Stockage Local Pro
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos données localement avec une performance maximale et une sécurité accrue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSyncFromCloud} 
            disabled={isSyncing}
            className="rounded-xl shadow-lg shadow-primary/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync depuis Cloud
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-primary/5 to-transparent overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Zap className="w-24 h-24 text-primary" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              État de la base
            </CardTitle>
            <CardDescription>Performance et stockage IndexedDB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end border-b pb-4 border-primary/10">
              <span className="text-sm text-muted-foreground">Total des entrées</span>
              <span className="text-4xl font-bold">{totalEntries}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Dernière synchro</span>
                <span className="font-mono">{lastSync ? new Date(lastSync).toLocaleString('fr-FR') : 'Jamais'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Moteur de stockage</span>
                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">IndexedDB Pro</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management Card */}
        <Card className="md:col-span-2 rounded-3xl border-none shadow-xl bg-card">
          <CardHeader>
            <CardTitle>Actions de Maintenance</CardTitle>
            <CardDescription>Outils professionnels pour la gestion de vos données locales.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border bg-muted/30 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-medium">
                <Download className="w-4 h-4 text-blue-500" />
                Exportation JSON
              </div>
              <p className="text-xs text-muted-foreground">Téléchargez une copie complète de vos données pour un usage externe ou archive.</p>
              <Button variant="outline" size="sm" onClick={handleExport} className="mt-auto rounded-xl">
                Sauvegarder
              </Button>
            </div>

            <div className="p-4 rounded-2xl border bg-muted/30 flex flex-col gap-3 relative">
              <div className="flex items-center gap-2 font-medium">
                <Upload className="w-4 h-4 text-green-500" />
                Restauration
              </div>
              <p className="text-xs text-muted-foreground">Importez des données depuis un fichier JSON de sauvegarde.</p>
              <Button variant="outline" size="sm" className="mt-auto rounded-xl relative overflow-hidden">
                Parcourir...
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImport} 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t flex justify-between">
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tight font-semibold">
              <AlertCircle className="w-3 h-3" />
              Manipulation sensible
            </div>
            <Button variant="ghost" size="sm" onClick={handleWipe} className="text-destructive hover:bg-destructive/10 rounded-xl">
              <Trash2 className="w-4 h-4 mr-2" />
              Effacer tout
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {Object.entries(stats).map(([name, count]) => (
          <motion.div 
            key={name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl border bg-card shadow-sm flex flex-col items-center justify-center text-center gap-1 hover:border-primary/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <FileJson className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground truncate w-full">{name}</span>
            <span className="text-xl font-bold">{count}</span>
          </motion.div>
        ))}
      </div>

      <Card className="rounded-3xl border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Pourquoi utiliser le Stockage Local Pro ?</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Performance Éclair
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Les données locales sont accessibles instantanément. Plus d'attente réseau pour les recherches et les filtres complexes.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Mode Hors-Ligne Pro
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Continuez à travailler même sans connexion internet. Vos modifications sont sauvegardées en toute sécurité sur votre appareil.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <FileJson className="w-4 h-4 text-blue-500" />
              Portabilité des Données
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Exportez vos données au format JSON standard pour une utilisation dans Excel, d'autres outils d'analyse ou pour archivage externe.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalDatabase;
