import React, { useMemo, useState, useEffect } from 'react';
import { DailyEntry, ITEMS, ItemType, getItemPrice, InventoryEntry, ItemPriceConfig } from '../types';
import { loadInventory, savePrices } from '../lib/storage';
import { Activity, DollarSign, PackageMinus, TrendingDown, Layers, Target, AlertTriangle, Lock, Save, CalendarDays, FileDown, Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type PeriodFilter = 'monthly' | 'first_half' | 'second_half';

interface OverviewProps {
  data: DailyEntry[];
  month: number;
  year: number;
  block: string;
  hotelId: string;
  customPrices?: Record<string, ItemPriceConfig>;
  onPricesUpdate?: (prices: Record<string, ItemPriceConfig>) => void;
}

export const Overview: React.FC<OverviewProps> = ({ data, month, year, block, hotelId, customPrices, onPricesUpdate }) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const [inventoryList, setInventoryList] = useState<InventoryEntry[]>([]);
  
  // Pricing tab state
  const [overviewTab, setOverviewTab] = useState<'metrics' | 'pricing'>('metrics');
  const [pin, setPin] = useState('');
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(false);
  const [editingPrices, setEditingPrices] = useState<Record<string, ItemPriceConfig>>({});
  const [savingPrices, setSavingPrices] = useState(false);

  // New custom item form
  const [newItem, setNewItem] = useState({ label: '', washingPrice: '', replacementPrice: '' });

  // Period filter state
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('monthly');

  useEffect(() => {
    if (customPrices) {
      setEditingPrices(customPrices);
    }
  }, [customPrices]);

  useEffect(() => {
    loadInventory().then(setInventoryList);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Compute period day range
  const periodRange = useMemo(() => {
    if (periodFilter === 'first_half') return { start: 1, end: 15 };
    if (periodFilter === 'second_half') return { start: 16, end: daysInMonth };
    return { start: 1, end: daysInMonth };
  }, [periodFilter, daysInMonth]);

  const periodLabel = useMemo(() => {
    if (periodFilter === 'first_half') return `1ª Quinzena (01–15/${String(month).padStart(2, '0')})`;
    if (periodFilter === 'second_half') return `2ª Quinzena (16–${String(daysInMonth).padStart(2, '0')}/${String(month).padStart(2, '0')})`;
    return `Mês Completo`;
  }, [periodFilter, month, daysInMonth]);

  const stats = useMemo(() => {
    // 1. OPERATIONAL & LAUNDRY COST DATA
    const itemStats: Record<ItemType, { enviado: number; recebido: number; diferenca: number; custoLavagem: number }> = {} as any;
    
    ITEMS.forEach(item => {
        itemStats[item.id] = { enviado: 0, recebido: 0, diferenca: 0, custoLavagem: 0 };
    });

    let totalCustoLavanderia = 0;
    let totalEnviado = 0;
    let totalRecebido = 0;
    const chartData: any[] = [];

    for (let i = periodRange.start; i <= periodRange.end; i++) {
        const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const entry = data.find(d => d.date === dayStr);
        let dayCustoLocal = 0;
        let dayEnvLocal = 0;
        let dayRecLocal = 0;

        if (entry) {
            ITEMS.forEach(item => {
                const env = entry.items[item.id]?.enviado || 0;
                const rec = entry.items[item.id]?.recebido || 0;
                const itemWashingPrice = customPrices?.[item.id]?.washingPrice ?? item.washingPrice;
                const custoLv = env * itemWashingPrice; // Washing cost

                itemStats[item.id].enviado += env;
                itemStats[item.id].recebido += rec;
                itemStats[item.id].diferenca += (rec - env);
                itemStats[item.id].custoLavagem += custoLv;

                totalCustoLavanderia += custoLv;
                totalEnviado += env;
                totalRecebido += rec;
                
                dayEnvLocal += env;
                dayRecLocal += rec;
                dayCustoLocal += custoLv;
            });
        }
        
        chartData.push({
            dia: String(i).padStart(2, '0'),
            enviado: dayEnvLocal,
            recebido: dayRecLocal,
            custo: dayCustoLocal
        });
    }

    const itemsArray = ITEMS.map(item => ({
        ...item,
        ...itemStats[item.id]
    }));

    // Operational Evasion: Quantities only where Env > Rec
    const evasaoOperacional = itemsArray.filter(i => i.enviado > i.recebido).sort((a,b) => (b.enviado - b.recebido) - (a.enviado - a.recebido));

    // 2. INVENTORY DATA (Patrimonial Evasion)
    let previousMonth = month - 1;
    let previousYear = year;
    if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = year - 1;
    }

    const currentInvMatch = inventoryList.find(inv => inv.block === block && inv.month === month && inv.year === year);
    const prevInvMatch = inventoryList.find(inv => inv.block === block && inv.month === previousMonth && inv.year === previousYear);

    let custoEvasaoPatrimonial = 0;
    const invDataArray = ITEMS.map(item => {
        const curItems = currentInvMatch ? currentInvMatch.items[item.id] : null;
        const prevItems = prevInvMatch ? prevInvMatch.items[item.id] : null;
        
        const curTotal = curItems ? (typeof curItems === 'number' ? curItems : curItems.hotel + curItems.lavanderia + curItems.danificado) : 0;
        const prevTotal = prevItems ? (typeof prevItems === 'number' ? prevItems : prevItems.hotel + prevItems.lavanderia + prevItems.danificado) : 0;
        
        const falta = prevInvMatch && currentInvMatch ? Math.max(0, prevTotal - curTotal) : 0;
        const itemReplacementPrice = customPrices?.[item.id]?.replacementPrice ?? (getItemPrice(item.id, hotelId) || 0);
        const penaltyCost = falta * itemReplacementPrice;

        custoEvasaoPatrimonial += penaltyCost;

        return {
            ...item,
            curTotal,
            prevTotal,
            falta,
            penaltyCost
        };
    }).filter(i => i.falta > 0).sort((a,b) => b.penaltyCost - a.penaltyCost);

    // Pie chart for washing cost distribution
    const pieData = itemsArray.filter(i => i.custoLavagem > 0).map(i => ({ name: i.label, value: i.custoLavagem })).sort((a,b) => b.value - a.value).slice(0, 5);
    const pieColors = ['#0f172a', '#b45309', '#0ea5e9', '#64748b', '#cbd5e1']; // Executive palette: deepest navy, bronze/copper, teal/sky, slate

    return {
        totalCustoLavanderia,
        totalEnviado,
        totalRecebido,
        chartData,
        evasaoOperacional,
        invDataArray,
        custoEvasaoPatrimonial,
        pieData,
        pieColors,
        hasPrevInv: !!prevInvMatch,
        hasCurrentInv: !!currentInvMatch
    };
  }, [data, daysInMonth, inventoryList, month, year, block, hotelId, periodRange]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1808') {
      setIsPinAuthenticated(true);
      setPin('');
    } else {
      alert('PIN incorreto.');
    }
  };

  const handlePriceChange = (itemId: string, field: 'washingPrice' | 'replacementPrice', value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingPrices(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { washingPrice: ITEMS.find(i => i.id === itemId)?.washingPrice || 0, replacementPrice: getItemPrice(itemId as ItemType, hotelId) || 0 }),
        [field]: numValue
      }
    }));
  };

  const handleSavePrices = async () => {
    setSavingPrices(true);
    await savePrices(hotelId, editingPrices);
    if (onPricesUpdate) {
      onPricesUpdate(editingPrices);
    }
    setSavingPrices(false);
    alert('Preços salvos com sucesso!');
  };

  const handleAddCustomItem = () => {
    const trimmed = newItem.label.trim();
    if (!trimmed) { alert('Informe o nome do item.'); return; }
    const id = `custom_${Date.now()}`;
    setEditingPrices(prev => ({
      ...prev,
      [id]: {
        label: trimmed,
        isCustom: true,
        washingPrice: parseFloat(newItem.washingPrice) || 0,
        replacementPrice: parseFloat(newItem.replacementPrice) || 0,
      }
    }));
    setNewItem({ label: '', washingPrice: '', replacementPrice: '' });
  };

  const handleRemoveCustomItem = (id: string) => {
    setEditingPrices(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const exportToCSV = () => {
    const rows: string[] = [];
    const fmt = (v: number) => v.toFixed(2).replace('.', ',');
    const sep = ';';

    // ── Section 1: Header ──────────────────────────────────────────────
    rows.push(`RELATÓRIO DE FECHAMENTO DE LAVANDERIA`);
    rows.push(`Período${sep}${periodLabel}`);
    rows.push(`Gerado em${sep}${new Date().toLocaleString('pt-BR')}`);
    rows.push('');

    // ── Section 2: KPIs ────────────────────────────────────────────────
    rows.push(`RESUMO DO PERÍODO`);
    rows.push(`Indicador${sep}Valor`);
    rows.push(`Custo Total de Lavanderia${sep}R$ ${fmt(stats.totalCustoLavanderia)}`);
    rows.push(`Custo Médio por Dia${sep}R$ ${fmt(stats.totalCustoLavanderia / (periodRange.end - periodRange.start + 1))}`);
    rows.push(`Total de Peças Enviadas${sep}${stats.totalEnviado}`);
    rows.push(`Total de Peças Recebidas${sep}${stats.totalRecebido}`);
    rows.push(`Evasão Patrimonial (Multa Est.)${sep}R$ ${fmt(stats.custoEvasaoPatrimonial)}`);
    rows.push('');

    // ── Section 3: Per-item breakdown ─────────────────────────────────
    rows.push(`DETALHAMENTO POR ITEM`);
    rows.push(`Item${sep}Enviado${sep}Recebido${sep}Diferença${sep}Custo Lavagem (R$)`);

    ITEMS.forEach(item => {
      let enviado = 0;
      let recebido = 0;
      let custoLavagem = 0;
      for (let i = periodRange.start; i <= periodRange.end; i++) {
        const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const entry = data.find(d => d.date === dayStr);
        if (entry) {
          const env = entry.items[item.id]?.enviado || 0;
          const rec = entry.items[item.id]?.recebido || 0;
          const washPrice = customPrices?.[item.id]?.washingPrice ?? item.washingPrice;
          enviado += env;
          recebido += rec;
          custoLavagem += env * washPrice;
        }
      }
      const diferenca = recebido - enviado;
      rows.push(`${item.label}${sep}${enviado}${sep}${recebido}${sep}${diferenca}${sep}${fmt(custoLavagem)}`);
    });
    rows.push('');

    // ── Section 4: Daily cost timeline ────────────────────────────────
    rows.push(`LINHA DO TEMPO DIÁRIA`);
    rows.push(`Dia${sep}Peças Enviadas${sep}Peças Recebidas${sep}Custo do Dia (R$)`);
    stats.chartData.forEach((d: any) => {
      rows.push(`${d.dia}${sep}${d.enviado}${sep}${d.recebido}${sep}${fmt(d.custo)}`);
    });
    rows.push('');

    // ── Section 5: Operational evasion ────────────────────────────────
    rows.push(`EVASÃO OPERACIONAL (Hotel ↔ Lavanderia)`);
    if (stats.evasaoOperacional.length > 0) {
      rows.push(`Item${sep}Enviado${sep}Recebido${sep}Faltas`);
      stats.evasaoOperacional.forEach((item: any) => {
        rows.push(`${item.label}${sep}${item.enviado}${sep}${item.recebido}${sep}${item.enviado - item.recebido}`);
      });
    } else {
      rows.push(`Nenhuma evasão operacional no período.`);
    }
    rows.push('');

    // ── Section 6: Patrimonial evasion ────────────────────────────────
    rows.push(`EVASÃO PATRIMONIAL (Inventário)`);
    if (stats.invDataArray.length > 0) {
      rows.push(`Item${sep}Qtd Anterior${sep}Qtd Atual${sep}Falta${sep}Custo Reposição (R$)`);
      stats.invDataArray.forEach((item: any) => {
        rows.push(`${item.label}${sep}${item.prevTotal}${sep}${item.curTotal}${sep}${item.falta}${sep}${fmt(item.penaltyCost)}`);
      });
    } else {
      rows.push(`Sem perdas patrimoniais no período.`);
    }

    // ── Export ────────────────────────────────────────────────────────
    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const periodSlug = periodFilter === 'first_half' ? '1Quinzena' : periodFilter === 'second_half' ? '2Quinzena' : 'Mensal';
    link.setAttribute('href', url);
    link.setAttribute('download', `Fechamento_Lavanderia_${String(month).padStart(2, '0')}_${year}_${periodSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800">
      <div className="flex flex-wrap items-center gap-3">
        {/* View Tabs */}
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-slate-200">
          <button
            onClick={() => setOverviewTab('metrics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${overviewTab === 'metrics' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Métricas Executivas
          </button>
          <button
            onClick={() => setOverviewTab('pricing')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${overviewTab === 'pricing' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Precificação
          </button>
        </div>

        {/* Period Filter — only show on metrics tab */}
        {overviewTab === 'metrics' && (
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-1.5 px-3 text-slate-400">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Período</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            {([
              { value: 'monthly',     label: 'Mensal' },
              { value: 'first_half',  label: '1ª Quinzena' },
              { value: 'second_half', label: '2ª Quinzena' },
            ] as { value: PeriodFilter; label: string }[]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriodFilter(opt.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  periodFilter === opt.value
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Active period badge + Export */}
        {overviewTab === 'metrics' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
              <CalendarDays className="w-3.5 h-3.5" />
              Fechamento: {periodLabel}
            </span>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
            >
              <FileDown className="w-4 h-4" />
              Exportar Planilha
            </button>
          </div>
        )}
      </div>

      {overviewTab === 'metrics' ? (
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Executive Panel */}
        <div className="flex-1 space-y-6">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custo de Lavanderia</h3>
              <div className="p-2 bg-slate-50 rounded-lg"><DollarSign className="w-5 h-5 text-slate-700" /></div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(stats.totalCustoLavanderia)}</p>
              <p className="text-xs text-amber-600 mt-1 font-medium bg-amber-50 inline-block px-2 py-0.5 rounded-full">Itens Enviados × Tarifa · {periodLabel}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custo Adicional Diário</h3>
              <div className="p-2 bg-slate-50 rounded-lg"><Activity className="w-5 h-5 text-slate-700" /></div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(stats.totalCustoLavanderia / (periodRange.end - periodRange.start + 1))}
              </p>
              <p className="text-xs text-sky-600 mt-1 font-medium bg-sky-50 inline-block px-2 py-0.5 rounded-full">Por dia ({periodRange.end - periodRange.start + 1} dias)</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume Físico Lavado</h3>
              <div className="p-2 bg-slate-50 rounded-lg"><Target className="w-5 h-5 text-slate-700" /></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.totalEnviado.toLocaleString('pt-BR')}
                </p>
                <span className="text-sm text-slate-500 font-medium mb-1">peças</span>
              </div>
              <p className="text-xs text-indigo-600 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded-full w-max">
                Total movimentado no mês
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-6">Tendência de Gasto Operacional</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.chartData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line type="monotone" name="Custo/Dia" dataKey="custo" stroke="#0f172a" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#b45309', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-6">Composição de Gastos</h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={stats.pieColors[index % stats.pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              {/* Central Value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-xs text-slate-400 font-medium tracking-wide">TOTAL</span>
                 <span className="text-lg font-bold text-slate-900">{formatCurrency(stats.totalCustoLavanderia)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Evasion Table */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                 <PackageMinus className="w-4 h-4 text-slate-500" />
                 Evasão Operacional (Hotel ⟷ Lavanderia)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Déficit físico no check-in/check-out diário. Indica perdas no transporte.</p>
            </div>
          </div>
          <div className="p-0">
            {stats.evasaoOperacional.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.evasaoOperacional.map(item => {
                  const falta = item.enviado - item.recebido;
                  return (
                    <div key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {falta.toString().padStart(2, '0')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                          <p className="text-xs text-slate-400">Rotina diária</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                         <div className="text-xs text-slate-400">
                           Env: <span className="text-slate-600 font-medium">{item.enviado}</span><br/>
                           Rec: <span className="text-slate-600 font-medium">{item.recebido}</span>
                         </div>
                         <div className="bg-rose-50 text-rose-700 px-3 py-1 rounded-md text-xs font-bold border border-rose-100">
                           {falta} Faltas
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nenhuma evasão operacional diária encontrada no período.
              </div>
            )}
           </div>
        </div>

      </div>

      {/* Side Panel: Patrimonial Evasion */}
      <div className="w-full xl:w-96 flex-shrink-0 flex flex-col gap-6">
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-6 relative overflow-hidden h-full flex flex-col">
          {/* Decorative subtle gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Layers className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-white font-bold tracking-wide">Evasão Patrimonial</h2>
              <p className="text-slate-400 text-xs mt-0.5">Baseado em Inventário (Mes a Mês)</p>
            </div>
          </div>

          <div className="relative z-10 bg-slate-800/80 rounded-2xl p-5 mb-6 border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider font-semibold">Projeção da Multa</p>
            <p className="text-3xl font-extrabold text-white">{formatCurrency(stats.custoEvasaoPatrimonial)}</p>
            {hotelId !== 'eco' && (
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3"/> Valores não parametrizados.
              </p>
            )}
          </div>

          <div className="relative z-10 flex-1">
            {!stats.hasPrevInv ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center mb-4 bg-slate-800/50">
                   <TrendingDown className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-300 font-medium text-sm">Aguardando dados</p>
                <p className="text-slate-500 text-xs mt-2">Inventário do mês passado (Mês {month - 1 === 0 ? 12 : month - 1}) não encontrado para comparação.</p>
              </div>
            ) : !stats.hasCurrentInv ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center mb-4 bg-slate-800/50">
                   <Layers className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-300 font-medium text-sm">Conclua o Inventário</p>
                <p className="text-slate-500 text-xs mt-2">Salve pelo menos uma vez os dados na aba "Inventário" deste mês.</p>
              </div>
            ) : stats.invDataArray.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-16 h-16 rounded-full border border-emerald-900 flex items-center justify-center mb-4 bg-emerald-900/20">
                   <Activity className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-emerald-400 font-bold text-sm">Estoque Positivo</p>
                <p className="text-emerald-600/70 text-xs mt-2">O saldo de inventário está igual ou superior ao do mês passado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">Detalhamento Físico</h4>
                {stats.invDataArray.map(item => (
                  <div key={item.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 transition-colors hover:bg-slate-800/80">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-slate-200 font-medium text-sm">{item.label}</p>
                      <p className="text-amber-500 font-bold text-sm">{formatCurrency(item.penaltyCost)}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                       <span className="text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded">
                         Falta: {item.falta}
                       </span>
                       <span className="text-slate-500">
                         Ant: {item.prevTotal} ➞ Agora: {item.curTotal}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10 mt-6 text-center border-t border-slate-800 pt-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">Auditoria Executiva do Estoque</p>
          </div>
        </div>
      </div>
      </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-4xl">
          {!isPinAuthenticated ? (
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
          ) : (
            <div className="space-y-8">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Tabela de Preços Ativos</h2>
                  <p className="text-sm text-slate-500 mt-1">Configure os valores unitários aplicados para o hotel selecionado.</p>
                </div>
                <button
                  onClick={handleSavePrices}
                  disabled={savingPrices}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {savingPrices ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>

              {/* ── Section 1: System items ── */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Itens do Sistema</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-3 px-4 font-bold text-slate-700 text-sm">Item</th>
                        <th className="py-3 px-4 font-bold text-slate-700 text-sm w-44">Custo de Lavagem (R$)</th>
                        <th className="py-3 px-4 font-bold text-slate-700 text-sm w-44">Custo de Reposição (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ITEMS.map((item) => {
                        const currentWash = editingPrices[item.id]?.washingPrice ?? item.washingPrice;
                        const currentRep = editingPrices[item.id]?.replacementPrice ?? (getItemPrice(item.id, hotelId) || 0);
                        return (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-medium text-slate-900 text-sm">{item.label}</td>
                            <td className="py-3 px-4">
                              <input type="number" min="0" step="0.01" value={currentWash}
                                onChange={(e) => handlePriceChange(item.id, 'washingPrice', e.target.value)}
                                className="w-full py-2 px-3 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input type="number" min="0" step="0.01" value={currentRep}
                                onChange={(e) => handlePriceChange(item.id, 'replacementPrice', e.target.value)}
                                className="w-full py-2 px-3 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Section 2: Custom items ── */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Itens Personalizados</h3>
                  {Object.values(editingPrices).filter(p => p.isCustom).length > 0 && (
                    <span className="text-xs text-slate-400">{Object.values(editingPrices).filter(p => p.isCustom).length} item(s)</span>
                  )}
                </div>

                {/* Existing custom items table */}
                {Object.entries(editingPrices).some(([, v]) => v.isCustom) ? (
                  <div className="overflow-x-auto rounded-xl border border-indigo-100 mb-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-indigo-50 border-b border-indigo-100">
                          <th className="py-3 px-4 font-bold text-indigo-700 text-sm">Nome do Item</th>
                          <th className="py-3 px-4 font-bold text-indigo-700 text-sm w-44">Custo de Lavagem (R$)</th>
                          <th className="py-3 px-4 font-bold text-indigo-700 text-sm w-44">Custo de Reposição (R$)</th>
                          <th className="py-3 px-4 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(editingPrices)
                          .filter(([, v]) => v.isCustom)
                          .map(([id, cfg]) => (
                            <tr key={id} className="border-b border-indigo-50 hover:bg-indigo-50/40 transition-colors">
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={cfg.label ?? ''}
                                  onChange={(e) => setEditingPrices(prev => ({
                                    ...prev,
                                    [id]: { ...prev[id], label: e.target.value }
                                  }))}
                                  className="w-full py-2 px-3 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input type="number" min="0" step="0.01" value={cfg.washingPrice}
                                  onChange={(e) => handlePriceChange(id, 'washingPrice', e.target.value)}
                                  className="w-full py-2 px-3 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input type="number" min="0" step="0.01" value={cfg.replacementPrice}
                                  onChange={(e) => handlePriceChange(id, 'replacementPrice', e.target.value)}
                                  className="w-full py-2 px-3 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleRemoveCustomItem(id)}
                                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Remover item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm mb-4">Nenhum item personalizado cadastrado ainda.</p>
                )}

                {/* Add new item form */}
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Novo Item
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nome do item *</label>
                      <input
                        type="text"
                        value={newItem.label}
                        onChange={(e) => setNewItem(p => ({ ...p, label: e.target.value }))}
                        placeholder="Ex: Cobertor Queen"
                        className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Custo de Lavagem (R$)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={newItem.washingPrice}
                        onChange={(e) => setNewItem(p => ({ ...p, washingPrice: e.target.value }))}
                        placeholder="0,00"
                        className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Custo de Reposição (R$)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={newItem.replacementPrice}
                        onChange={(e) => setNewItem(p => ({ ...p, replacementPrice: e.target.value }))}
                        placeholder="0,00"
                        className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none bg-white"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleAddCustomItem}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Item
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};
