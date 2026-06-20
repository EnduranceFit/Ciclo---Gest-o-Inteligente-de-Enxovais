import React, { useState, useMemo, useEffect } from 'react';
import { DailyEntry, ITEMS, MONTHS, HOTELS, ItemType, getItemPrice } from '../types';
import { loadData, loadMetrics, saveMetrics } from '../lib/storage';
import { toast } from 'sonner';
import { ArrowLeft, Building2, DollarSign, TrendingDown, Activity, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface GlobalDashboardProps {
  hotelId: string;
  unitLabel: string;
  month: number;
  year: number;
  onBack: () => void;
}

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ hotelId, unitLabel, month, year, onBack }) => {
  const [data, setData] = useState<DailyEntry[]>([]);
  const [uhsOcupadas, setUhsOcupadas] = useState<number>(0);
  useEffect(() => {
    Promise.allSettled([loadData(), loadMetrics()]).then(([dataResult, metricsResult]) => {
      if (dataResult.status === 'fulfilled') {
        setData(dataResult.value);
      } else {
        toast.error('Erro ao carregar dados.');
      }

      if (metricsResult.status === 'fulfilled') {
        const m = metricsResult.value.find(metric => metric.hotelId === hotelId && metric.month === month && metric.year === year);
        if (m) {
          setUhsOcupadas(m.uhsOcupadas);
        }
      } else {
        toast.error('Erro ao carregar métricas.');
      }
    });
  }, [hotelId, month, year]);

  const handleUhsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 0;
    setUhsOcupadas(val);
    saveMetrics({
      hotelId,
      month,
      year,
      uhsOcupadas: val
    }).catch(() => toast.error('Erro ao salvar métricas.'));
  };

  const monthLabel = MONTHS.find((m) => m.value === month)?.label;
  const hotel = HOTELS.find(h => h.id === hotelId)!;

  const stats = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthData = data.filter(d => d.hotelId === hotelId && d.date.startsWith(prefix));

    let totalCustoEvasao = 0;
    let totalCustoLavagem = 0;
    let totalEnviado = 0;
    let totalRecebido = 0;
    
    const blockStats: Record<string, { custoEvasao: number; custoLavagem: number; enviado: number; recebido: number; diferenca: number }> = {};
    hotel.blocks.forEach(b => {
      blockStats[b] = { custoEvasao: 0, custoLavagem: 0, enviado: 0, recebido: 0, diferenca: 0 };
    });

    monthData.forEach(entry => {
      const b = entry.block;
      if (!blockStats[b]) return;

      ITEMS.forEach(item => {
        const env = entry.items[item.id]?.enviado || 0;
        const rec = entry.items[item.id]?.recebido || 0;
        const faltantes = Math.max(0, env - rec);
        const custoEv = faltantes * (getItemPrice(item.id as ItemType, hotelId) || 0);
        const custoLv = env * item.washingPrice;

        blockStats[b].custoEvasao += custoEv;
        blockStats[b].custoLavagem += custoLv;
        blockStats[b].enviado += env;
        blockStats[b].recebido += rec;
        blockStats[b].diferenca += (rec - env);

        totalCustoEvasao += custoEv;
        totalCustoLavagem += custoLv;
        totalEnviado += env;
        totalRecebido += rec;
      });
    });

    const chartData = hotel.blocks.map(b => ({
      name: `Bloco ${b}`,
      custoEvasao: blockStats[b].custoEvasao,
      custoLavagem: blockStats[b].custoLavagem,
      diferenca: blockStats[b].diferenca
    }));

    return {
      totalCustoEvasao,
      totalCustoLavagem,
      totalEnviado,
      totalRecebido,
      totalDiferenca: totalRecebido - totalEnviado,
      blockStats,
      chartData
    };
  }, [data, hotelId, hotel.blocks, month, year]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 shadow-sm border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Visão Global do {hotel.name} (Governanta Executiva)
              </h1>
              <p className="text-sm text-slate-400">{monthLabel} de {year}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Top Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Gasto Real com Lavanderia (Opex) */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custo Lavanderia Real</h3>
              <div className="p-2 bg-slate-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-slate-700" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(stats.totalCustoLavagem)}</p>
              <p className="text-xs text-amber-600 mt-1 font-medium bg-amber-50 inline-block px-2 py-0.5 rounded-full">Gasto Faturado</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custo Ocupacional (UHs)</h3>
              <div className="p-2 bg-slate-50 rounded-lg"><Target className="w-5 h-5 text-slate-700" /></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {uhsOcupadas > 0 ? formatCurrency(stats.totalCustoLavagem / uhsOcupadas) : 'R$ 0,00'}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="number" 
                  min="0"
                  value={uhsOcupadas || ''}
                  onChange={handleUhsChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full text-xs border-slate-200 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 py-1.5 px-2 border font-medium text-slate-700 [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="UHs Ocupadas no Mês"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Multa Projetada</h3>
              <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(stats.totalCustoEvasao)}</p>
              <p className="text-xs text-red-600 mt-1 font-medium bg-red-50 inline-block px-2 py-0.5 rounded-full">Extravio Operacional</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Diferença Consolidada</h3>
              <div className={`p-2 rounded-lg ${stats.totalDiferenca < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <Activity className={`w-5 h-5 ${stats.totalDiferenca < 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
            <div>
              <p className={`text-3xl font-extrabold tracking-tight ${stats.totalDiferenca < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.totalDiferenca > 0 ? `+${stats.totalDiferenca}` : stats.totalDiferenca}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Balanço de peças físicas</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider text-center">Custo Lavagem vs Multa Evasão (R$)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `R$ ${val}`} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle"/>
                  <Bar dataKey="custoLavagem" name="Lavagem (Tarifa)" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custoEvasao" name="Multa Evasão" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider text-center">Balanço Físico (Evasões / Sobras)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="diferenca" name="Diferença (Peças)" radius={[4, 4, 0, 0]}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.diferenca < 0 ? '#ef4444' : '#22c55e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-slate-700" />
            <h3 className="text-lg font-bold text-slate-900">Resumo Executivo por Bloco</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{unitLabel}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Enviado</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Recebido</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Diferença</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Fatura Lavagem</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Prejuízo Evasão</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {hotel.blocks.map((b) => {
                  const stat = stats.blockStats[b];
                  return (
                    <tr key={b} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{unitLabel} {b}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">{stat.enviado.toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">{stat.recebido.toLocaleString('pt-BR')}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${stat.diferenca > 0 ? 'text-green-600' : stat.diferenca < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {stat.diferenca > 0 ? `+${stat.diferenca}` : stat.diferenca}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-800 font-bold">
                        {formatCurrency(stat.custoLavagem)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-bold">
                        {formatCurrency(stat.custoEvasao)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 px-4 bg-gray-50 border-t border-gray-200 mt-auto shrink-0">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed font-medium max-w-4xl mx-auto">
          <strong>Todos os direitos reservados à Lagoa Parques e Hotéis - Caldas Novas - GO &copy;.</strong><br/>
          É expressamente proibido ceder ou compartilhar o acesso a este aplicativo com terceiros. A cópia, distribuição ou uso não autorizado constitui infração, sujeita às penalidades da Lei do Software (Lei nº 9.609/1998).
        </p>
      </footer>
    </div>
  );
};
