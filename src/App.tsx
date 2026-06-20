import React, { useState, useEffect } from 'react';
import { HotelSelection } from './components/HotelSelection';
import { SetupScreen } from './components/SetupScreen';
import { Dashboard } from './components/Dashboard';
import { GlobalDashboard } from './components/GlobalDashboard';
import { LoginPage } from './components/LoginPage';
import { HOTELS } from './types';
import { getCurrentUser, logout } from './lib/auth';
import { LogOut } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [setup, setSetup] = useState<{ block: string; month: number; year: number; user: string } | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
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
  const TopBar = () => (
    <div className="absolute top-4 right-4 z-50">
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 shadow-sm text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <span className="max-w-[100px] truncate">{currentUser}</span>
        <LogOut className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );

  if (!hotelId) {
    return (
      <>
        <TopBar />
        <HotelSelection onSelect={handleHotelSelect} currentUser={currentUser} />
      </>
    );
  }

  const hotel = HOTELS.find(h => h.id === hotelId)!;

  if (!setup) {
    return (
      <>
        <TopBar />
        <SetupScreen hotel={hotel} onStart={handleStart} onBack={handleBack} currentUser={currentUser} />
      </>
    );
  }

  if (setup.block === 'GLOBAL') {
    return (
      <>
        <TopBar />
        <GlobalDashboard
          hotelId={hotelId}
          unitLabel={hotel.unitLabel}
          month={setup.month}
          year={setup.year}
          user={setup.user}
          onBack={handleBack}
        />
      </>
    );
  }

  return (
    <>
      <TopBar />
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
