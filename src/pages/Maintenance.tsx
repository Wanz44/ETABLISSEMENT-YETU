import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dbLocal } from '../lib/db';
import { DataService } from '../lib/data';
import { MaintenanceTicket, Unit, Center } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Plus, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MoreVertical,
  Hammer,
  Search
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Maintenance() {
  const data = useLiveQuery(async () => {
    return {
      tickets: await dbLocal.maintenance.orderBy('createdAt').reverse().toArray(),
      units: await dbLocal.units.toArray(),
      centers: await dbLocal.centers.toArray(),
    };
  }) || { tickets: [], units: [], centers: [] };

  const { tickets, units, centers } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    unitId: '',
    priority: 'medium' as any,
    estimatedCost: 0
  });

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTicket = async () => {
    if (!newTicket.title || !newTicket.unitId) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    const unit = units.find(u => u.id === newTicket.unitId);
    
    try {
      await DataService.add('maintenance', {
        ...newTicket,
        centerId: unit?.centerId || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setIsDialogOpen(false);
      setNewTicket({ title: '', description: '', unitId: '', priority: 'medium', estimatedCost: 0 });
      toast.success('Ticket de maintenance ouvert');
    } catch (e) {
      toast.error('Erreur lors de la création du ticket');
    }
  };

  const updateTicketStatus = async (id: string, status: MaintenanceTicket['status']) => {
    try {
      await DataService.update('maintenance', id, { status });
      toast.success('Statut mis à jour');
    } catch (e) {
      toast.error('Erreur de mise à jour');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Maintenance & Travaux</h2>
          <p className="text-muted-foreground">Suivi des interventions techniques et réparations.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Signaler un Problème
            </Button>
          } />
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Nouveau Ticket de Maintenance</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Sujet / Titre</Label>
                <Input 
                  value={newTicket.title} 
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  placeholder="ex: Fuite d'eau, Panne électrique..."
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label>Unité concernée</Label>
                <Select value={newTicket.unitId} onValueChange={(val) => setNewTicket({...newTicket, unitId: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Sélectionner l'unité" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({centers.find(c => c.id === u.centerId)?.name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priorité</Label>
                  <Select value={newTicket.priority} onValueChange={(val) => setNewTicket({...newTicket, priority: val})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute / Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Coût estimé ($)</Label>
                  <Input 
                    type="number" 
                    value={newTicket.estimatedCost} 
                    onChange={(e) => setNewTicket({...newTicket, estimatedCost: parseFloat(e.target.value)})}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description détaillée</Label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Détaillez le problème rencontré..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTicket} className="w-full rounded-xl">Ouvrir le ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Rechercher un ticket..." 
          className="pl-10 rounded-2xl h-12 bg-card"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-amber-50/30 border-amber-100 rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">En attente</p>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">{tickets.filter(t => t.status === 'pending').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-blue-50/30 border-blue-100 rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">En cours</p>
              <Hammer className="w-4 h-4 text-blue-500" />
            </div>
            <CardTitle className="text-2xl">{tickets.filter(t => t.status === 'in_progress').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-emerald-50/30 border-emerald-100 rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Terminés</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl">{tickets.filter(t => t.status === 'completed').length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredTickets.map(ticket => {
          const unit = units.find(u => u.id === ticket.unitId);
          const center = centers.find(c => c.id === ticket.centerId);
          
          return (
            <Card key={ticket.id} className="rounded-3xl border-none shadow-xl shadow-foreground/5 hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                      {ticket.priority === 'high' ? 'Urgent' : ticket.priority === 'medium' ? 'Moyen' : 'Bas'}
                    </Badge>
                    <h3 className="text-lg font-bold">{ticket.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> {unit?.name} | {center?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Status</p>
                    <Badge variant={ticket.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                      {ticket.status === 'pending' ? 'En attente' : ticket.status === 'in_progress' ? 'En cours' : 'Terminé'}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-balance text-muted-foreground mb-6 line-clamp-2">
                  {ticket.description}
                </p>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Signalé le</p>
                      <p className="text-xs font-semibold">{format(new Date(ticket.createdAt), 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Budget Est.</p>
                      <p className="text-xs font-mono font-bold">${ticket.estimatedCost || 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {ticket.status === 'pending' && (
                      <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs" onClick={() => updateTicketStatus(ticket.id, 'in_progress')}>
                        Prendre en charge
                      </Button>
                    )}
                    {ticket.status === 'in_progress' && (
                      <Button size="sm" variant="default" className="rounded-xl h-8 text-xs" onClick={() => updateTicketStatus(ticket.id, 'completed')}>
                        Marquer résolu
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredTickets.length === 0 && (
          <div className="col-span-full py-20 text-center bg-card rounded-3xl border-2 border-dashed">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Aucun ticket de maintenance trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}
