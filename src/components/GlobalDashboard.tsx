import React, { useState, useMemo, useEffect } from 'react';
import { DailyEntry, ITEMS, MONTHS, HOTELS, ItemType, getItemPrice } from '../types';
import { loadData, loadMetrics, saveMetrics } from '../lib/storage';
import { toast } from 'sonner';
import { ArrowLeft, Building2, DollarSign, Activity, Target, CalendarDays, Lightbulb, TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

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
    const yearData = data.filter(d => d.hotelId === hotelId && d.date.startsWith(`${year}-`));

    let totalCustoLavagem = 0;
    let totalEnviado = 0;
    let totalRecebido = 0;
    
    const blockStats: Record<string, { custoLavagem: number; enviado: number; recebido: number; diferenca: number }> = {};
    hotel.blocks.forEach(b => {
      blockStats[b] = { custoLavagem: 0, enviado: 0, recebido: 0, diferenca: 0 };
    });

    monthData.forEach(entry => {
      const b = entry.block;
      if (!blockStats[b]) return;

      ITEMS.forEach(item => {
        const env = entry.items[item.id]?.enviado || 0;
        const rec = entry.items[item.id]?.recebido || 0;
        const custoLv = env * item.washingPrice;

        blockStats[b].custoLavagem += custoLv;
        blockStats[b].enviado += env;
        blockStats[b].recebido += rec;
        blockStats[b].diferenca += (rec - env);

        totalCustoLavagem += custoLv;
        totalEnviado += env;
        totalRecebido += rec;
      });
    });

    let totalCustoAno = 0;
    const historyStats: Record<number, Record<string, number>> = {};
    for (let m = 1; m <= 12; m++) {
        historyStats[m] = {};
        hotel.blocks.forEach(b => { historyStats[m][b] = 0; });
    }

    yearData.forEach(entry => {
       const [, entryMonth] = entry.date.split('-');
       const m = parseInt(entryMonth, 10);
       const b = entry.block;
       if (!historyStats[m] || historyStats[m][b] === undefined) return;

       let dayCusto = 0;
       ITEMS.forEach(item => {
         const env = entry.items[item.id]?.enviado || 0;
         dayCusto += env * item.washingPrice;
       });

       historyStats[m][b] += dayCusto;
       totalCustoAno += dayCusto;
    });

    const historyChartData = MONTHS.map(mObj => {
        const dataPoint: any = { name: mObj.label.substring(0, 3) };
        let hasData = false;
        hotel.blocks.forEach(b => {
            dataPoint[b] = historyStats[mObj.value][b];
            if (dataPoint[b] > 0) hasData = true;
        });
        return hasData ? dataPoint : null;
    }).filter(Boolean);

    const chartData = hotel.blocks.map(b => ({
      name: `Bloco ${b}`,
      custoLavagem: blockStats[b].custoLavagem,
      diferenca: blockStats[b].diferenca
    }));

    // Smart Insights Generation
    const insights = [];
    
    // 1. Bloco de maior custo
    let maxCostBlock = '';
    let maxCostValue = -1;
    Object.entries(blockStats).forEach(([b, stat]) => {
      if (stat.custoLavagem > maxCostValue) {
        maxCostValue = stat.custoLavagem;
        maxCostBlock = b;
      }
    });
    if (maxCostBlock && maxCostValue > 0) {
      insights.push({
        type: 'warning',
        icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
        text: `O Bloco ${maxCostBlock} lidera o custo de lavagem no mês (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(maxCostValue)}).`
      });
    }

    // 2. Balanço Físico Global
    const totalDiff = totalRecebido - totalEnviado;
    if (totalDiff < 0) {
      insights.push({
        type: 'danger',
        icon: <TrendingDown className="w-5 h-5 text-red-500" />,
        text: `Alerta de Evasão: Há um déficit de ${Math.abs(totalDiff)} peças físicas no balanço atual.`
      });
    } else if (totalDiff > 0) {
      insights.push({
        type: 'success',
        icon: <Activity className="w-5 h-5 text-green-500" />,
        text: `Balanço Positivo: O saldo do mês retornou ${totalDiff} peças excedentes.`
      });
    } else {
      insights.push({
        type: 'info',
        icon: <Info className="w-5 h-5 text-blue-500" />,
        text: `Balanço Estável: A quantidade de peças enviadas e recebidas está perfeitamente alinhada.`
      });
    }

    return {
      totalCustoLavagem,
      totalEnviado,
      totalRecebido,
      totalDiferenca: totalDiff,
      totalCustoAno,
      historyChartData,
      blockStats,
      chartData,
      insights
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Smart Insights Banner */}
        {stats.insights.length > 0 && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Lightbulb className="w-32 h-32 text-amber-300" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-amber-400" />
                <h2 className="text-lg font-bold text-white tracking-wide">Insights Inteligentes</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.insights.map((insight, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-start gap-4 transition-all hover:bg-white/15">
                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                      {insight.icon}
                    </div>
                    <p className="text-slate-200 text-sm font-medium leading-relaxed mt-0.5">
                      {insight.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Gasto Real com Lavanderia (Opex) */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
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

          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110"></div>
            <div className="flex items-start justify-between mb-2 relative z-10">
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
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custo Acumulado (Ano)</h3>
              <div className="p-2 bg-blue-50 rounded-lg">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(stats.totalCustoAno)}</p>
              <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded-full">Total em {year}</p>
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
            <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider text-center">Custo Lavagem por Bloco (Mês Atual)</h3>
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
                  <Bar dataKey="custoLavagem" name="Custo Lavagem" fill="#0f172a" radius={[4, 4, 0, 0]} />
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

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider text-center">Histórico Mensal de Custo por Bloco ({year})</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.historyChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `R$ ${val}`} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle"/>
                  {hotel.blocks.map((b, idx) => {
                     const colors = ['#0f172a', '#b45309', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e'];
                     return (
                       <Line key={b} type="monotone" dataKey={b} name={`Bloco ${b}`} stroke={colors[idx % colors.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                     );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Resumo Executivo por Bloco</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{unitLabel}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Enviado</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Recebido</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Diferença</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Fatura Lavagem</th>
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
