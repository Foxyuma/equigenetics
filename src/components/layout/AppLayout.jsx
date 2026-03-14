import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Heart, Trophy, ShoppingCart, Menu, X, Dna, Store, Package, GitBranch, TrendingUp, ChevronDown, Award, MapPin } from 'lucide-react';

const menuGroups = [
  {
    label: "Écurie",
    icon: Home,
    items: [
      { path: "/Stable", label: "Mes Chevaux", icon: Home },
      { path: "/Breeding", label: "Élevage", icon: Heart },
      { path: "/Training", label: "Entraînement", icon: TrendingUp },
      { path: "/Pedigree", label: "Lignées", icon: GitBranch },
      { path: "/Inventory", label: "Inventaire", icon: Package },
    ]
  },
  {
    label: "Classements",
    icon: Trophy,
    items: [
      { path: "/Competitions", label: "Compétitions", icon: Trophy },
      { path: "/Rankings", label: "Classement Général", icon: Award },
    ]
  },
  {
    label: "Ville",
    icon: MapPin,
    items: [
      { path: "/Market", label: "Marché", icon: ShoppingCart },
      { path: "/Shop", label: "Boutique", icon: Store },
    ]
  }
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

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
              <span className="text-lg font-bold text-stone-800 tracking-tight hidden sm:block">EquiGenes</span>
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
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

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