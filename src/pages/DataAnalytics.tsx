import React, { useState, useEffect } from 'react';
import { Database, Download, Cloud, Layers, ShieldCheck, Cpu, LineChart, Target, Search, BarChart3, DatabaseZap, LayoutGrid, Zap, Rocket, FileSpreadsheet, RotateCcw, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// Sub-components for each section
import DataIngestion from './analytics/DataIngestion';
import DataStorage from './analytics/DataStorage';
import DataGovernance from './analytics/DataGovernance';
import PredictiveAnalytics from './analytics/PredictiveAnalytics';
import MathAutomation from './analytics/MathAutomation';
import StrategicExploitation from './analytics/StrategicExploitation';

export default function DataAnalytics() {
  const [resetKey, setResetKey] = useState(0);
  const [importData, setImportData] = useState<any[] | null>(null);

  // Reset logic: Incrementing a key to force re-render/reset of child components
  // or clearing local states if they were stored globally.
  useEffect(() => {
    handleReset();
  }, []);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
    toast.success('Compteurs et pipelines réinitialisés à zéro');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setImportData(data);
        toast.success(`${data.length} lignes de données prospectives importées`);
      } catch (err) {
        toast.error('Erreur lors de la lecture du fichier');
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-full overflow-hidden">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] border border-[#E1E5EB] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
              <DatabaseZap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-[#1A1F36]">Data Analytics <span className="text-primary italic">Pro</span></h2>
          </div>
          <p className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Calculs Mathématiques & Architecture Bancaire</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <div className="relative group">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            />
            <Button variant="outline" className="h-10 px-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest border-[#E1E5EB] bg-white group-hover:bg-muted transition-colors">
              <Upload className="w-3 h-3 mr-2" /> Importer XLS/CSV
            </Button>
          </div>
          
          <Button onClick={handleReset} variant="outline" className="h-10 px-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest border-[#E1E5EB] bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all">
            <RotateCcw className="w-3 h-3 mr-2 text-rose-500" /> Reset
          </Button>

          <Badge variant="outline" className="h-10 px-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100 italic flex items-center gap-2">
            <Zap className="w-3 h-3 fill-emerald-600" /> Math Engine v2
          </Badge>
        </div>
      </div>

      {importData && (
        <Card className="rounded-[2rem] border-2 border-emerald-100 bg-emerald-50/30 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg text-white">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <p className="text-xs font-black uppercase text-emerald-800 tracking-tight">
                Fichier Actif: <span className="italic">{importData.length} records chargés pour traitement mathématique</span>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setImportData(null)} className="text-xs font-black uppercase text-rose-600 hover:bg-rose-100 rounded-lg h-8">
              Décharger
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="ingestion" className="w-full">
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <TabsList className="bg-white border p-1 rounded-2xl h-auto flex whitespace-nowrap min-w-max shadow-sm">
            <TabsTrigger value="ingestion" className="rounded-xl px-4 md:px-6 py-2.5 md:py-3 font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <Download className="w-4 h-4" /> 1. Ingestion
            </TabsTrigger>
            <TabsTrigger value="storage" className="rounded-xl px-4 md:px-6 py-2.5 md:py-3 font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <Cloud className="w-4 h-4" /> 2. Architecture
            </TabsTrigger>
            <TabsTrigger value="governance" className="rounded-xl px-4 md:px-6 py-2.5 md:py-3 font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 3. Gouvernance
            </TabsTrigger>
            <TabsTrigger value="analysis" className="rounded-xl px-4 md:px-6 py-2.5 md:py-3 font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <LineChart className="w-4 h-4" /> 4. Analyse Probabiliste
            </TabsTrigger>
            <TabsTrigger value="math" className="rounded-xl px-4 md:px-6 py-2.5 md:py-3 font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4" /> 5. Algorithmes
            </TabsTrigger>
            <TabsTrigger value="strategic" className="rounded-xl px-4 md:px-6 py-2.5 md:py-3 font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <Rocket className="w-4 h-4" /> 6. Stratégie
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-8">
          <TabsContent value="ingestion" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DataIngestion key={`ingest-${resetKey}`} />
          </TabsContent>
          <TabsContent value="storage" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DataStorage key={`store-${resetKey}`} />
          </TabsContent>
          <TabsContent value="governance" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DataGovernance key={`gov-${resetKey}`} />
          </TabsContent>
          <TabsContent value="analysis" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PredictiveAnalytics key={`pred-${resetKey}`} importData={importData} />
          </TabsContent>
          <TabsContent value="math" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MathAutomation key={`math-${resetKey}`} />
          </TabsContent>
          <TabsContent value="strategic" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StrategicExploitation key={`strat-${resetKey}`} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
