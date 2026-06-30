import { useState, useEffect } from 'react';
import { HotelSelection } from './components/HotelSelection';
import { SetupScreen } from './components/SetupScreen';
import { Dashboard } from './components/Dashboard';
import { GlobalDashboard } from './components/GlobalDashboard';
import { LoginPage } from './components/LoginPage';
import { HOTELS } from './types';
import { getCurrentUser, isTokenExpired, logout } from './lib/auth';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { syncAllData } from './lib/storage';
import { toast } from 'sonner';

export default function App() {
  const { currentUser, hotelId, setCurrentUser, setHotelId } = useAppStore();
  const [setup, setSetup] = useState<{ block: string; month: number; year: number; user: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    const token = localStorage.getItem('token');
    if (user && token && !isTokenExpired()) {
      setCurrentUser(user);
    } else {
      logout();
      setCurrentUser(null);
      setHotelId(null);
    }
  }, []);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setHotelId(null);
    setSetup(null);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Sincronizando informações com a nuvem...');
    const result = await syncAllData();
    setIsSyncing(false);
    if (result.success) {
      toast.success(result.message, { id: toastId });
    } else {
      toast.error(result.message, { id: toastId });
    }
  };

  const handleHotelSelect = (id: string) => {
    setHotelId(id);
  };

  const handleStart = (block: string, month: number, year: number, user: string) => {
    setSetup({ block, month, year, user });
  };

  const handleBack = () => {
    if (setup) {
      setSetup(null);
    } else {
      setHotelId(null);
    }
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Common Top Bar with Logout
  const topBar = (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      {currentUser?.toUpperCase() === 'JONATAN.ALMEIDA' && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          title="Sincronizar dados com o servidor em nuvem usando o token autenticado"
          className="flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 shadow-sm text-gray-700 px-4 py-2 rounded-full hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar API'}</span>
        </button>
      )}

      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 shadow-sm text-gray-700 px-4 py-2 rounded-full hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all text-sm font-medium"
      >
        <span className="max-w-[100px] truncate">{currentUser}</span>
        <LogOut className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );

  if (!hotelId) {
    return (
      <>
        {topBar}
        <HotelSelection onSelect={handleHotelSelect} currentUser={currentUser} />
      </>
    );
  }

  const hotel = HOTELS.find(h => h.id === hotelId)!;

  if (!setup) {
    return (
      <>
        {topBar}
        <SetupScreen hotel={hotel} onStart={handleStart} onBack={handleBack} currentUser={currentUser} />
      </>
    );
  }

  if (setup.block === 'GLOBAL') {
    return (
      <>
        {topBar}
        <GlobalDashboard
          hotelId={hotelId}
          unitLabel={hotel.unitLabel}
          month={setup.month}
          year={setup.year}
          onBack={handleBack}
        />
      </>
    );
  }

  return (
    <>
      {topBar}
      <Dashboard
        hotelId={hotelId}
        unitLabel={hotel.unitLabel}
        block={setup.block}
        month={setup.month}
        year={setup.year}
        user={setup.user}
        onBack={handleBack}
      />
    </>
  );
}
