import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { verifyPin } from '../../lib/auth';
import { toast } from 'sonner';

interface AdminGateProps {
  children: React.ReactNode;
}

export const AdminGate: React.FC<AdminGateProps> = ({ children }) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await verifyPin(pin);
    if (res.success) {
      setIsAuthenticated(true);
      setPin('');
    } else {
      toast.error('PIN incorreto.');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 max-w-sm mx-auto">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Acesso Restrito</h2>
      <p className="text-slate-500 text-sm text-center mb-6">Digite o PIN de administrador para alterar a tabela de preços.</p>
      <form onSubmit={handlePinSubmit} className="w-full flex flex-col gap-4">
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN numérico"
          className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 border-slate-300 rounded-xl shadow-sm focus:ring-slate-800 focus:border-slate-800"
          autoFocus
        />
        <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors">
          Acessar
        </button>
      </form>
    </div>
  );
};
