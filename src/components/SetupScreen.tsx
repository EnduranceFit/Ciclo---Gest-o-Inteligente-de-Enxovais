import React, { useState, useEffect } from 'react';
import { Hotel, MONTHS } from '../types';
import { Building2, Calendar, Play, User, Globe, ArrowLeft } from 'lucide-react';

interface SetupScreenProps {
  hotel: Hotel;
  onStart: (block: string, month: number, year: number, user: string) => void;
  onBack: () => void;
  currentUser?: string | null;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ hotel, onStart, onBack }) => {
  const [block, setBlock] = useState<string>(hotel.blocks[0]);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const user = currentUser || 'Usuário Desconhecido';

  useEffect(() => {
    // block selection effect remains if needed, but user is now fixed.
  }, [block, hotel]);

  const handleStart = () => {
    onStart(block, month, year, user);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background vectors */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-[0%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-orange-600/10 blur-3xl mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-2xl p-8 sm:p-10 w-full max-w-lg relative z-10">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Início
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{hotel.name}</h1>
          <p className="text-slate-500 text-sm">Selecione os parâmetros de operação para iniciar.</p>
        </div>

        <div className="space-y-6">
          {hotel.blocks.length > 1 && (
            <div>
              <label className="block text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                {hotel.unitLabel}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
                {hotel.blocks.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBlock(b)}
                    className={`py-2 px-2 rounded-lg border-2 font-medium transition-all text-sm ${
                      block === b
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Mês
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 border bg-white text-base"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Ano
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 border bg-white text-base [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Nome do Responsável
            </label>
            <div className="w-full rounded-xl py-3 px-4 border bg-gray-100 text-gray-600 font-medium text-base border-gray-200 cursor-not-allowed">
              {user}
            </div>
            <p className="mt-2 text-base text-gray-500 flex items-center gap-1">
              <span className="font-medium text-gray-700">Cargo:</span> Supervisora de Governança
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={handleStart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
            >
              <Play className="w-6 h-6" />
              Acessar {hotel.unitLabel} {block}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-base">ou</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              onClick={() => onStart('GLOBAL', month, year, user)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
            >
              <Globe className="w-6 h-6" />
              Visão Global (Governanta Executiva)
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 sm:bottom-6 w-full px-4 z-10 text-center pointer-events-none">
        <p className="text-[9px] sm:text-[10px] text-slate-500/70 leading-relaxed max-w-3xl mx-auto font-medium">
          <strong>Todos os direitos reservados à Lagoa Parques e Hotéis - Caldas Novas - GO &copy;.</strong><br/>
          É expressamente proibido ceder ou compartilhar o acesso a este aplicativo com terceiros. A cópia, distribuição ou uso não autorizado constitui infração, sujeita às penalidades da Lei do Software (Lei nº 9.609/1998).
        </p>
      </div>
    </div>
  );
};
