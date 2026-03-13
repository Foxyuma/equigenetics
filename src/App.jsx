import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Stable from './pages/Stable';
import HorseDetail from './pages/HorseDetail';
import Training from './pages/Training';
import Breeding from './pages/Breeding';
import Pedigree from './pages/Pedigree';
import Competitions from './pages/Competitions';
import Market from './pages/Market';
import Shop from './pages/Shop';
import Inventory from './pages/Inventory';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-500 text-sm">Chargement d'EquiGenes...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Stable" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/Stable" element={<Stable />} />
        <Route path="/HorseDetail" element={<HorseDetail />} />
        <Route path="/Training" element={<Training />} />
        <Route path="/Breeding" element={<Breeding />} />
        <Route path="/Pedigree" element={<Pedigree />} />
        <Route path="/Competitions" element={<Competitions />} />
        <Route path="/Market" element={<Market />} />
        <Route path="/Shop" element={<Shop />} />
        <Route path="/Inventory" element={<Inventory />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App