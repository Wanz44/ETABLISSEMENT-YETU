import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useAppStore } from '../store/useAppStore';
import { dbLocal } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  PieChart,
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  Menu,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  BarChart3,
  ShieldCheck,
  DatabaseZap,
  Settings,
  Search as SearchIcon,
  X,
  Building,
  User,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}

  const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, active, collapsed }) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative mx-2",
        active 
          ? "bg-primary/10 text-primary font-semibold" 
          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-200", active ? "text-primary" : "text-muted-foreground")} />
      {!collapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[13px] font-medium whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md border">
          {label}
        </div>
      )}
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const location = useLocation();
  const { isSidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/centers', icon: Building2, label: 'Centres & Unités' },
    { to: '/tenants', icon: Users, label: 'Locataires' },
    { to: '/contracts', icon: FileText, label: 'Contrats' },
    { to: '/invoices', icon: Receipt, label: 'Facturation' },
    { to: '/payments', icon: CreditCard, label: 'Paiements' },
    { to: '/expenses', icon: TrendingDown, label: 'Dépenses' },
    { to: '/reports', icon: BarChart3, label: 'Rapports' },
    { to: '/analytics', icon: PieChart, label: 'Analyses Pro' },
    { to: '/data-analytic', icon: DatabaseZap, label: 'Data Analytic' },
    { to: '/database', icon: ShieldCheck, label: 'Stockage Local' },
    { to: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  const SidebarContent = ({ isMobile = false, onNavigate }: { isMobile?: boolean, onNavigate?: () => void }) => (
    <div className="flex flex-col h-full py-4">
      <div className={cn("px-6 mb-10 flex items-center gap-3", collapsed && !isMobile && "px-4 justify-center")}>
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        {(!collapsed || isMobile) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            <h1 className="text-lg font-black text-[#1A1F36] tracking-tighter leading-none">GRACE <span className="text-primary italic">BANK</span></h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Management Portal</p>
          </motion.div>
        )}
      </div>

      <nav className={cn("flex-1 space-y-1", collapsed && !isMobile && "px-2")}>
        {navItems.map((item) => (
          <div key={item.to} onClick={onNavigate}>
            <NavItem 
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to} 
              collapsed={collapsed && !isMobile}
            />
          </div>
        ))}
      </nav>

      <div className={cn("px-3 mt-auto pt-6 border-t", collapsed && !isMobile && "px-2")}>
        <div className={cn(
          "flex items-center gap-3 px-3 py-3 bg-muted/50 rounded-2xl transition-all duration-300",
          collapsed && !isMobile ? "px-2 justify-center" : ""
        )}>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <UserIcon className="w-4 h-4 text-primary" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{profile?.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{profile?.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F3F5F8] font-sans selection:bg-primary/10 selection:text-primary">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col sticky top-0 h-screen bg-white border-r transition-all duration-300 z-40 no-print shadow-[1px_0_10px_rgba(0,0,0,0.02)]",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent />
        <Button
          variant="secondary"
          size="icon"
          className="absolute -right-3 top-10 w-6 h-6 rounded-full border shadow-sm z-50 bg-white hover:bg-muted"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header with Smart Search */}
        <header className="h-20 bg-white border-b px-6 lg:px-10 flex items-center justify-between no-print shrink-0 z-30">
          <div className="flex-1 max-w-2xl relative group">
            <SmartSearch />
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-black uppercase tracking-tighter">Portefeuille Global</span>
              <span className="text-[10px] text-muted-foreground font-bold italic">Audit au {new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
               <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Nav Trigger */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50 no-print">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={
            <Button size="icon" className="w-14 h-14 rounded-full shadow-2xl shadow-primary/40">
              <Menu className="w-6 h-6" />
            </Button>
          } />
          <SheetContent side="left" className="p-0 w-72 rounded-r-3xl border-none">
            <SidebarContent isMobile onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

// Smart Search Component
function SmartSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const results = useLiveQuery(async () => {
    if (query.length < 2) return null;
    const q = query.toLowerCase();
    
    const centers = await dbLocal.centers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.description.toLowerCase().includes(q) || 
      c.location.toLowerCase().includes(q)
    ).limit(3).toArray();

    const buildings = await dbLocal.buildings.filter(b => 
      b.name.toLowerCase().includes(q) || 
      b.description.toLowerCase().includes(q)
    ).limit(3).toArray();

    const tenants = await dbLocal.tenants.filter(t => 
      t.name.toLowerCase().includes(q) || 
      (t.company && t.company.toLowerCase().includes(q)) ||
      (t.activityType && t.activityType.toLowerCase().includes(q))
    ).limit(3).toArray();
    
    const contracts = await dbLocal.contracts.toArray();
    const filteredContracts = contracts.filter(c => 
      c.id.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    ).slice(0, 3);

    return { centers, buildings, tenants, contracts: filteredContracts };
  }, [query]);

  const hasResults = results && (
    results.centers.length > 0 || 
    results.buildings.length > 0 ||
    results.tenants.length > 0 || 
    results.contracts.length > 0
  );

  return (
    <div className="relative w-full">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input 
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Recherche intelligente (Centres, Locataires, Contrats...)"
          className="w-full bg-muted/30 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium placeholder:text-muted-foreground/60"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/5"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full mt-2 w-full bg-white rounded-3xl shadow-2xl border border-muted/50 overflow-hidden z-50"
            >
              {!hasResults ? (
                <div className="p-8 text-center">
                  <p className="text-xs font-black uppercase text-muted-foreground italic mb-1">Aucune correspondance stratégique</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Affinez vos critères de recherche.</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {results.centers.length > 0 && (
                    <div>
                      <h4 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#697386] opacity-60">Pôles Commerciaux</h4>
                      {results.centers.map(center => (
                        <div 
                          key={center.id}
                          onClick={() => { navigate('/centers'); setQuery(''); setIsOpen(false); }}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 cursor-pointer group/item transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <Building className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase tracking-tight">{center.name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold">{center.location}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {results.buildings.length > 0 && (
                    <div>
                      <h4 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#697386] opacity-60">Immeubles / Pavillons</h4>
                      {results.buildings.map(building => (
                        <div 
                          key={building.id}
                          onClick={() => { navigate('/centers'); setQuery(''); setIsOpen(false); }}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 cursor-pointer group/item transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase tracking-tight">{building.name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold line-clamp-1">{building.description}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {results.tenants.length > 0 && (
                    <div>
                      <h4 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#697386] opacity-60">Répertoire Locataires</h4>
                      {results.tenants.map(tenant => (
                        <div 
                          key={tenant.id}
                          onClick={() => { navigate(`/tenants/${tenant.id}`); setQuery(''); setIsOpen(false); }}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 cursor-pointer group/item transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase tracking-tight">{tenant.name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold">{tenant.company || 'Compte Particulier'}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {results.contracts.length > 0 && (
                    <div>
                      <h4 className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#697386] opacity-60">Titres Locatifs</h4>
                      {results.contracts.map(contract => (
                        <div 
                          key={contract.id}
                          onClick={() => { navigate('/contracts'); setQuery(''); setIsOpen(false); }}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 cursor-pointer group/item transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase tracking-tight">Bail #{String(contract.id).slice(0, 8).toUpperCase()}</p>
                              <p className="text-[10px] text-muted-foreground font-bold">Du {contract.startDate}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
