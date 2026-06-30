import React from 'react';
import { HOTELS } from '../types';
import { Building2, ChevronRight } from 'lucide-react';

interface HotelSelectionProps {
  onSelect: (hotelId: string) => void;
  currentUser?: string | null;
}

export const HotelSelection: React.FC<HotelSelectionProps> = ({ onSelect, currentUser }) => {
  const isHotelAllowed = (hotelId: string) => {
    if (!currentUser) return true;
    const user = currentUser.toUpperCase();
    if (user === 'JONATAN.ALMEIDA') return true;
    
    const ecoUsers = ['ADRIANA.SILVA', 'GISELE.KARINE', 'ANA.LIDIA', 'EMILLY.CRISTINA', 'LETICIA.FRANÇA'];
    const jardinsUsers = ['MAYNARA.VIANA', 'TEREZINHA.SILVA', 'MARCELO.COSTA', 'MARCELO.SILVA'];
    
    if (hotelId === 'eco') return ecoUsers.includes(user);
    if (hotelId === 'jardins') return jardinsUsers.includes(user);
    return false;
  };
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative premium background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-orange-500/10 blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-sky-400/10 blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="absolute top-[40%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-indigo-600/10 blur-3xl mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[2rem] shadow-2xl p-8 sm:p-12 w-full max-w-md relative z-10 transition-all">
        
        <div className="flex justify-center mb-8">
          {/* Logo Premium CICLO - Abstract C Cycle */}
          <div className="relative group flex justify-center items-center">
            {/* Outer Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/40 to-sky-500/40 blur-[32px] rounded-full group-hover:blur-[40px] transition-all duration-700 pointer-events-none"></div>
            
            <div className="relative flex items-center justify-center w-24 h-24 bg-slate-900/80 border border-slate-700/50 rounded-[2rem] shadow-2xl backdrop-blur-xl z-10 overflow-hidden group-hover:border-orange-500/30 transition-all duration-500">
              {/* Internal abstract elements representing a cycle */}
              <div className="absolute top-1/4 right-1/4 w-12 h-12 border-[3px] border-t-orange-500 border-r-orange-500 border-b-transparent border-l-transparent rounded-full transform group-hover:rotate-180 transition-transform duration-1000 ease-in-out"></div>
              <div className="absolute bottom-1/4 left-1/4 w-12 h-12 border-[3px] border-b-sky-400 border-l-sky-400 border-t-transparent border-r-transparent rounded-full transform group-hover:-rotate-180 transition-transform duration-1000 ease-in-out"></div>
              
              <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] z-20 group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">CICLO</h1>
          <p className="text-sky-300 text-xs font-medium tracking-[0.2em] uppercase opacity-90">Gestão Inteligente de Enxovais</p>
        </div>

        <div className="space-y-4">
          {HOTELS.map((hotel) => {
            const allowed = isHotelAllowed(hotel.id);
            return (
            <button
              key={hotel.id}
              onClick={() => allowed && onSelect(hotel.id)}
              disabled={!allowed}
              className={`group w-full p-5 rounded-2xl border flex items-center gap-4 text-left transition-all duration-300 ${
                allowed 
                  ? 'bg-white/5 border-white/10 hover:bg-slate-700/50 hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] cursor-pointer' 
                  : 'bg-white/2 border-white/5 opacity-50 cursor-not-allowed grayscale'
              }`}
            >
              <div className={`p-3 rounded-xl transition-colors ${allowed ? 'bg-slate-900/50 group-hover:bg-orange-500/20' : 'bg-slate-900/30'}`}>
                <Building2 className={`w-6 h-6 transition-colors ${allowed ? 'text-sky-400 group-hover:text-orange-400' : 'text-slate-600'}`} />
              </div>
              <div className="flex-1">
                <h2 className={`font-bold text-lg ${allowed ? 'text-white' : 'text-slate-400'}`}>{hotel.name}</h2>
                <p className={`text-xs transition-colors ${allowed ? 'text-slate-400 group-hover:text-sky-200' : 'text-slate-500'}`}>
                  {hotel.blocks.length > 1 ? `${hotel.blocks.length} ${hotel.unitLabelPlural}` : 'Área Global'}
                </p>
              </div>
              {allowed ? (
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transform group-hover:translate-x-1 transition-all" />
              ) : (
                <span className="text-[10px] uppercase font-bold text-red-400/70 border border-red-500/20 bg-red-500/10 px-2 py-1 rounded-md">Sem Acesso</span>
              )}
            </button>
          )})}
        </div>
        
        <div className="mt-8 text-center text-[10px] text-slate-500 font-medium tracking-wider uppercase">
          SISTEMA EXCLUSIVO - GRUPO LAGOA
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
