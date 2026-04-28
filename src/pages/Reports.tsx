import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon,
  Download,
  Filter,
  FileSpreadsheet,
  FileText as FileTextIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../lib/db';
import { Payment, Expense, Center, Unit, Contract } from '../types';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

export default function Reports() {
  const data = useLiveQuery(async () => {
    return {
      payments: await dbLocal.payments.toArray(),
      expenses: await dbLocal.expenses.toArray(),
      centers: await dbLocal.centers.toArray(),
      units: await dbLocal.units.toArray(),
      contracts: await dbLocal.contracts.toArray(),
      invoices: await dbLocal.invoices.toArray()
    };
  }) || { payments: [], expenses: [], centers: [], units: [], contracts: [], invoices: [] };

  const { payments, expenses, centers, units, contracts, invoices } = data;

  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'CDF'>('USD');

  const filteredData = useMemo(() => {
    const start = parseISO(dateRange.start);
    const end = parseISO(dateRange.end);

    const filteredPayments = payments.filter(p => {
      const date = parseISO(p.date);
      const inRange = isWithinInterval(date, { start, end });
      const matchesCurrency = p.currency === selectedCurrency;
      
      let matchesCenter = selectedCenter === 'all';
      if (!matchesCenter) {
        // Link to center via Invoice -> Contract -> Unit
        const invoice = invoices.find(i => i.id === p.invoiceId);
        if (invoice) {
          const contract = contracts.find(c => c.id === invoice.contractId);
          if (contract) {
            const unit = units.find(u => u.id === contract.unitId);
            if (unit) {
              matchesCenter = unit.centerId === selectedCenter;
            }
          }
        }
      }

      return inRange && matchesCurrency && matchesCenter;
    });

    const filteredExpenses = expenses.filter(e => {
      const date = parseISO(e.date);
      const inRange = isWithinInterval(date, { start, end });
      const matchesCurrency = e.currency === selectedCurrency;
      const matchesCenter = selectedCenter === 'all' || e.centerId === selectedCenter;
      return inRange && matchesCurrency && matchesCenter;
    });

    return { payments: filteredPayments, expenses: filteredExpenses };
  }, [payments, expenses, dateRange, selectedCenter, selectedCurrency]);

  const stats = useMemo(() => {
    const totalRevenue = filteredData.payments.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = filteredData.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Occupancy Rate
    const centerUnits = selectedCenter === 'all' ? units : units.filter(u => u.centerId === selectedCenter);
    const occupiedUnits = centerUnits.filter(u => u.status === 'occupied').length;
    const occupancyRate = centerUnits.length > 0 ? (occupiedUnits / centerUnits.length) * 100 : 0;

    return { totalRevenue, totalExpenses, netProfit, occupancyRate, totalUnits: centerUnits.length, occupiedUnits };
  }, [filteredData, units, selectedCenter]);

  const chartData = useMemo(() => {
    // Group by month
    const months: { [key: string]: { month: string, revenue: number, expenses: number } } = {};
    
    // Initialize months in range
    let current = parseISO(dateRange.start);
    const end = parseISO(dateRange.end);
    while (current <= end) {
      const key = format(current, 'MMM yyyy', { locale: fr });
      months[key] = { month: key, revenue: 0, expenses: 0 };
      current = new Date(current.setMonth(current.getMonth() + 1));
    }

    filteredData.payments.forEach(p => {
      const key = format(parseISO(p.date), 'MMM yyyy', { locale: fr });
      if (months[key]) months[key].revenue += p.amount;
    });

    filteredData.expenses.forEach(e => {
      const key = format(parseISO(e.date), 'MMM yyyy', { locale: fr });
      if (months[key]) months[key].expenses += e.amount;
    });

    return Object.values(months);
  }, [filteredData, dateRange]);

  const expenseByCategory = useMemo(() => {
    const categories: { [key: string]: number } = {};
    filteredData.expenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const centerName = selectedCenter === 'all' ? 'Tous les centres' : centers.find(c => c.id === selectedCenter)?.name;
    
    doc.setFontSize(20);
    doc.text('RAPPORT FINANCIER STRATÉGIQUE', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Période: ${dateRange.start} au ${dateRange.end}`, 20, 25);
    doc.text(`Centre: ${centerName}`, 20, 30);
    doc.text(`Devise: ${selectedCurrency}`, 20, 35);

    autoTable(doc, {
      startY: 45,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Revenus Totaux', `${stats.totalRevenue.toLocaleString()} ${selectedCurrency}`],
        ['Dépenses Totales', `${stats.totalExpenses.toLocaleString()} ${selectedCurrency}`],
        ['Bénéfice Net', `${stats.netProfit.toLocaleString()} ${selectedCurrency}`],
        ['Taux d\'Occupation', `${stats.occupancyRate.toFixed(1)}%`],
        ['Unités Totales', stats.totalUnits.toString()],
        ['Unités Occupées', stats.occupiedUnits.toString()]
      ],
      theme: 'striped'
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Mois', 'Revenus', 'Dépenses', 'Bénéfice']],
      body: chartData.map(row => [
        row.month,
        row.revenue.toLocaleString(),
        row.expenses.toLocaleString(),
        (row.revenue - row.expenses).toLocaleString()
      ])
    });

    doc.save(`Rapport_${centerName?.replace(/\s+/g, '_')}_${dateRange.start}.pdf`);
    toast.success('Rapport PDF généré avec succès');
  };

  const exportExcel = () => {
    const centerName = selectedCenter === 'all' ? 'Tous les centres' : centers.find(c => c.id === selectedCenter)?.name;
    
    const summaryData = [
      { 'Indicateur': 'Période Début', 'Valeur': dateRange.start },
      { 'Indicateur': 'Période Fin', 'Valeur': dateRange.end },
      { 'Indicateur': 'Centre', 'Valeur': centerName },
      { 'Indicateur': 'Devise', 'Valeur': selectedCurrency },
      { 'Indicateur': 'Revenus Totaux', 'Valeur': stats.totalRevenue },
      { 'Indicateur': 'Dépenses Totales', 'Valeur': stats.totalExpenses },
      { 'Indicateur': 'Bénéfice Net', 'Valeur': stats.netProfit },
      { 'Indicateur': 'Taux d\'Occupation (%)', 'Valeur': stats.occupancyRate.toFixed(2) }
    ];

    const monthlyData = chartData.map(row => ({
      'Mois': row.month,
      'Revenus': row.revenue,
      'Dépenses': row.expenses,
      'Bénéfice': row.revenue - row.expenses
    }));

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Détails Mensuels');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, `Audit_Financier_${centerName?.replace(/\s+/g, '_')}.xlsx`);
    toast.success('Export Excel terminé');
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rapports Financiers</h2>
          <p className="text-muted-foreground">Analysez la performance de vos biens immobiliers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel} className="rounded-xl font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="rounded-xl font-bold bg-rose-50 text-rose-700 border-rose-200">
            <FileTextIcon className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-muted/30 border-none shadow-none">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Période du</Label>
              <Input 
                type="date" 
                value={dateRange.start} 
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Au</Label>
              <Input 
                type="date" 
                value={dateRange.end} 
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Centre</Label>
              <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les centres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les centres</SelectItem>
                  {centers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={selectedCurrency} onValueChange={(val: any) => setSelectedCurrency(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CDF">CDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp className="w-12 h-12 text-emerald-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus Totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.totalRevenue.toLocaleString()} {selectedCurrency}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingDown className="w-12 h-12 text-destructive" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dépenses Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.totalExpenses.toLocaleString()} {selectedCurrency}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <BarChart3 className="w-12 h-12 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bénéfice Net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.netProfit >= 0 ? "text-primary" : "text-destructive")}>
              {stats.netProfit.toLocaleString()} {selectedCurrency}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Building2 className="w-12 h-12 text-blue-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux d'occupation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.occupancyRate.toFixed(1)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {stats.occupiedUnits} / {stats.totalUnits} unités occupées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Revenus vs Dépenses</CardTitle>
            <CardDescription>Évolution mensuelle sur la période sélectionnée.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenus" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Dépenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Répartition des Dépenses</CardTitle>
            <CardDescription>Analyse par catégorie de dépenses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground">
                <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Aucune donnée de dépense.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance par Mois</CardTitle>
          <CardDescription>Détails chiffrés de la période.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Mois</th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Revenus</th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Dépenses</th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Bénéfice</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {chartData.slice().reverse().map((row) => (
                  <tr key={row.month} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-2 align-middle font-medium">{row.month}</td>
                    <td className="p-2 align-middle text-right text-emerald-600">{row.revenue.toLocaleString()}</td>
                    <td className="p-2 align-middle text-right text-destructive">{row.expenses.toLocaleString()}</td>
                    <td className={cn("p-2 align-middle text-right font-bold", row.revenue - row.expenses >= 0 ? "text-primary" : "text-destructive")}>
                      {(row.revenue - row.expenses).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
