import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useAppStore } from '../store/useAppStore';
import { 
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
  Sun,
  Moon,
  TrendingDown,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { cn } from '../lib/utils';
import { useTheme } from 'next-themes';
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
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
        active 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-200", !active && "group-hover:scale-110")} />
      {!collapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-medium whitespace-nowrap"
        >
          {label}
        </motion.span>
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isSidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/centers', icon: Building2, label: 'Centres & Unités' },
    { to: '/tenants', icon: Users, label: 'Locataires' },
    { to: '/contracts', icon: FileText, label: 'Contrats' },
    { to: '/invoices', icon: Receipt, label: 'Facturation' },
    { to: '/payments', icon: CreditCard, label: 'Paiements' },
    { to: '/expenses', icon: TrendingDown, label: 'Dépenses' },
    { to: '/reports', icon: BarChart3, label: 'Rapports' },
    { to: '/database', icon: ShieldCheck, label: 'Stockage Local' },
  ];

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full py-6">
      <div className={cn("px-6 mb-8 flex items-center justify-between", collapsed && !isMobile && "px-4 justify-center")}>
        {!collapsed || isMobile ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            <h1 className="text-xl font-bold text-primary tracking-tight leading-none">YETU Admin</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Gestion Immobilière</p>
          </motion.div>
        ) : (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">Y</div>
        )}
      </div>

      <nav className={cn("flex-1 px-3 space-y-1.5", collapsed && !isMobile && "px-2")}>
        {navItems.map((item) => (
          <NavItem 
            key={item.to} 
            to={item.to}
            icon={item.icon}
            label={item.label}
            active={location.pathname === item.to} 
            collapsed={collapsed && !isMobile}
          />
        ))}
      </nav>

      <div className={cn("px-3 mt-auto pt-6 border-t space-y-4", collapsed && !isMobile && "px-2")}>
        <Button
          variant="ghost"
          size="icon"
          className="w-full justify-center hover:bg-muted rounded-xl"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {mounted && (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
        </Button>

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
    <div className="flex min-h-screen bg-background font-sans selection:bg-primary/10 selection:text-primary">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col sticky top-4 h-[calc(100vh-2rem)] my-4 ml-4 bg-card border rounded-3xl transition-all duration-300 shadow-xl shadow-foreground/5 z-40",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
        <Button
          variant="secondary"
          size="icon"
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border shadow-md z-50"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>

      {/* Mobile Nav Trigger */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={
            <Button size="icon" className="w-14 h-14 rounded-full shadow-2xl shadow-primary/40">
              <Menu className="w-6 h-6" />
            </Button>
          } />
          <SheetContent side="left" className="p-0 w-72 rounded-r-3xl border-none">
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
