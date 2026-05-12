import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Heart, Trophy, ShoppingCart, Menu, X, Dna, Store, Package, GitBranch, TrendingUp, ChevronDown, Award, MapPin, Mail, ArrowRightLeft, Activity, Calendar, LayoutGrid, Users, UserCircle, History, Zap, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import CurrencyDisplay from './CurrencyDisplay';
import GameClockDisplay from './GameClockDisplay';
import { base44 } from '@/api/base44Client';

const menuGroups = [
  {
    label: "Écurie",
    icon: Home,
    items: [
      { path: "/Stable", label: "Mes Chevaux", icon: Home },
      { path: "/Breeding", label: "Élevage", icon: Heart },
      { path: "/BreedingBook", label: "Carnet d'élevage", icon: BookOpen },
      { path: "/Training", label: "Entraînement", icon: TrendingUp },
      { path: "/Pedigree", label: "Lignées", icon: GitBranch },
      { path: "/SeasonCalendar", label: "Calendrier", icon: Calendar },
      { path: "/Paddocks", label: "Paddocks", icon: LayoutGrid },
      { path: "/Staff", label: "Personnel", icon: Users },
      { path: "/Profile", label: "Mon Profil", icon: UserCircle },
    ]
  },
  {
    label: "Classements",
    icon: Trophy,
    items: [
      { path: "/Competitions", label: "Compétitions", icon: Trophy },
      { path: "/Rankings", label: "Classement Général", icon: Award },
      { path: "/StallionInspection", label: "Inspection Étalons", icon: Award },
    ]
  },
  {
    label: "Messagerie",
    icon: Mail,
    items: [
      { path: "/Messages", label: "Messages", icon: Mail },
      { path: "/Trades", label: "Échanges", icon: ArrowRightLeft },
    ]
  },
  {
    label: "Ville",
    icon: MapPin,
    items: [
      { path: "/Market", label: "Marché & Enchères", icon: ShoppingCart },
      { path: "/StallionMarket", label: "Marché des Saillies", icon: Dna },
      { path: "/GeneticTest", label: "Labo Génétique", icon: Dna },
      { path: "/Inventory", label: "Inventaire", icon: Package },
      { path: "/Shop", label: "Boutique", icon: Store },
      { path: "/VetClinic", label: "Clinique Vétérinaire", icon: Activity },
    ]
  }
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user-nav'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (!currentUser) return;
    const updates = {};
    if (currentUser.genesis_balance == null) updates.genesis_balance = 300000;
    if (currentUser.credits_balance == null) updates.credits_balance = 200;
    if (Object.keys(updates).length > 0) {
      base44.auth.updateMe(updates);
    }
  }, [currentUser?.email]);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages-nav'],
    queryFn: () => base44.entities.Message.filter({ recipient_email: currentUser?.email }),
    enabled: !!currentUser,
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/Stable" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-200/50">
                <Dna className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-stone-800 tracking-tight hidden sm:block">EquiGenesis</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {menuGroups.map(group => {
                const GroupIcon = group.icon;
                const isAnyActive = group.items.some(item => location.pathname === item.path);
                return (
                  <div 
                    key={group.label}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(group.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isAnyActive 
                          ? 'bg-stone-800 text-white shadow-lg shadow-stone-300/30' 
                          : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      <GroupIcon className="w-4 h-4" />
                      {group.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === group.label ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {openDropdown === group.label && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50">
                        {group.items.map(item => {
                          const ItemIcon = item.icon;
                          const isActive = location.pathname === item.path;
                          const showBadge = item.path === '/Messages' && unreadCount > 0;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                isActive 
                                  ? 'bg-stone-100 text-stone-800' 
                                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                              }`}
                            >
                              <ItemIcon className="w-4 h-4" />
                              {item.label}
                              {showBadge && (
                                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                  {unreadCount}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Currencies */}
            <div className="hidden sm:flex items-center gap-3">
              <GameClockDisplay />
              <CurrencyDisplay />
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Déconnexion
              </button>
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-stone-100">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-stone-100 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-3">
              {menuGroups.map(group => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.label} className="space-y-1">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-stone-400 uppercase tracking-wider">
                      <GroupIcon className="w-3.5 h-3.5" />
                      {group.label}
                    </div>
                    {group.items.map(item => {
                      const ItemIcon = item.icon;
                      const isActive = location.pathname === item.path;
                      const showBadge = item.path === '/Messages' && unreadCount > 0;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4" />
                          {item.label}
                          {showBadge && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}