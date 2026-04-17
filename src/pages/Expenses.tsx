import React, { useEffect, useState } from 'react';
import { Plus, TrendingDown, Calendar, DollarSign, MoreVertical, Trash2, Tag, Building2 } from 'lucide-react';
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
import { subscribeCollection, addDocument, deleteDocument } from '../lib/firestore';
import { Expense, Center } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    currency: 'USD' as const,
    category: 'maintenance',
    date: format(new Date(), 'yyyy-MM-dd'),
    centerId: ''
  });

  useEffect(() => {
    const unsubExpenses = subscribeCollection<Expense>('expenses', (data) => {
      setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    const unsubCenters = subscribeCollection<Center>('centers', setCenters);
    
    return () => {
      unsubExpenses();
      unsubCenters();
    };
  }, []);

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      await addDocument('expenses', {
        ...newExpense,
        createdAt: new Date().toISOString()
      });
      setIsDialogOpen(false);
      setNewExpense({
        description: '',
        amount: 0,
        currency: 'USD',
        category: 'maintenance',
        date: format(new Date(), 'yyyy-MM-dd'),
        centerId: ''
      });
      toast.success('Dépense enregistrée avec succès');
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteDocument('expenses', expenseToDelete);
      toast.success('Dépense supprimée');
      setExpenseToDelete(null);
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const categories = [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'utilities', label: 'Services Publics (Eau/Elec)' },
    { value: 'taxes', label: 'Taxes & Impôts' },
    { value: 'salary', label: 'Salaires' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Autre' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dépenses</h2>
          <p className="text-muted-foreground">Suivi des charges et dépenses opérationnelles.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Dépense
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Enregistrer une Dépense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Input 
                  id="desc" 
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  placeholder="ex: Réparation ascenseur"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Montant</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="amount" 
                      type="number" 
                      className="flex-1"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                    />
                    <Select value={newExpense.currency} onValueChange={(val: any) => setNewExpense({...newExpense, currency: val})}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CDF">CDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Catégorie</Label>
                  <Select value={newExpense.category} onValueChange={(val) => setNewExpense({...newExpense, category: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Centre (Optionnel)</Label>
                  <Select value={newExpense.centerId} onValueChange={(val) => setNewExpense({...newExpense, centerId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les centres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun centre spécifique</SelectItem>
                      {centers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddExpense}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Dépenses (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {expenses.filter(e => e.currency === 'USD').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} USD
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Dépenses (CDF)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {expenses.filter(e => e.currency === 'CDF').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} CDF
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nombre de dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenses.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Centre</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const center = centers.find(c => c.id === expense.centerId);
              const categoryLabel = categories.find(c => c.value === expense.category)?.label;
              
              return (
                <TableRow key={expense.id}>
                  <TableCell className="text-sm">
                    {format(new Date(expense.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {expense.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      {categoryLabel}
                    </div>
                  </TableCell>
                  <TableCell>
                    {center ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        {center.name}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="font-semibold text-destructive">
                    - {expense.amount.toLocaleString()} {expense.currency}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                      setExpenseToDelete(expense.id);
                      setIsConfirmOpen(true);
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <TrendingDown className="w-12 h-12 mb-4 opacity-20" />
                    <p>Aucune dépense enregistrée.</p>
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
        title="Supprimer la dépense"
        description="Êtes-vous sûr de vouloir supprimer cette dépense ?"
        onConfirm={handleDeleteExpense}
      />
    </div>
  );
}
