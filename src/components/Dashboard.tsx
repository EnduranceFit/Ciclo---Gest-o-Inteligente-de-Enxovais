import React, { useState, useMemo, useEffect } from 'react';
import { DailyEntry, ItemType, ITEMS, createEmptyDailyItems, MONTHS } from '../types';
import { loadData, saveData, loadPrices, syncAllData } from '../lib/storage';
import { toast } from 'sonner';
import { ArrowLeft, FileSpreadsheet, BarChart3, Edit2, ClipboardList, Download, LayoutDashboard, Settings, RefreshCw, ShieldCheck } from 'lucide-react';
import { DailyForm } from './DailyForm';
import { Indicators } from './Indicators';
import { Inventory } from './Inventory';
import { Overview } from './Overview';
import { useAppStore } from '../store/useAppStore';

interface DashboardProps {
  hotelId: string;
  unitLabel: string;
  block: string;
  month: number;
  year: number;
  user: string;
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ hotelId, unitLabel, block, month, year, user, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'indicators' | 'inventory' | 'ajustes'>('daily');
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [tokenInput, setTokenInput] = useState(localStorage.getItem('token') || '');
  const [data, setData] = useState<DailyEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { prices, setPrices } = useAppStore();

  const handleSaveToken = () => {
    localStorage.setItem('token', tokenInput);
    toast.success('Token de sincronização salvo com sucesso!');
  };

  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    Promise.allSettled([loadData(), loadPrices()]).then(([dataResult, pricesResult]) => {
      if (dataResult.status === 'fulfilled') {
        const d = dataResult.value;
        console.log('[DEBUG] loadData retornou:', d.length, 'registros', d);
        setDebugInfo(`${d.length} registros carregados`);
        setData(d);
      } else {
        const err = dataResult.reason;
        console.error('[DEBUG] loadData FALHOU:', err);
        setDebugInfo(`Falha: ${err?.message || 'erro desconhecido'}`);
        toast.error('Erro ao carregar dados.');
      }

      if (pricesResult.status === 'fulfilled') {
        const hotelPrices = pricesResult.value.find(p => p.hotel_id === hotelId)?.prices || {};
        setPrices(hotelPrices);
      } else {
        toast.error('Erro ao carregar preços.');
      }
    });
  }, [hotelId]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthLabel = MONTHS.find((m) => m.value === month)?.label;

  // Filter data for current hotel, block and month
  const currentData = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return data.filter((d) => d.hotelId === hotelId && d.block === block && d.date.startsWith(prefix));
  }, [data, hotelId, block, month, year]);

  const handleApiSync = async () => {
    setIsSyncingApi(true);
    const toastId = toast.loading('Executando sincronização com a API em nuvem...');
    const result = await syncAllData();
    setIsSyncingApi(false);
    if (result.success) {
      toast.success(result.message, { id: toastId });
    } else {
      toast.error(result.message, { id: toastId });
    }
  };

  const handleSaveEntry = async (entry: DailyEntry, nextEntry: DailyEntry) => {
    let newData = [...data];
    
    const updateOrAddEntry = (targetEntry: DailyEntry) => {
      const existingIndex = newData.findIndex((d) => d.date === targetEntry.date && d.block === targetEntry.block && d.hotelId === targetEntry.hotelId);
      const updated = {
        ...targetEntry,
        hotelId,
        updatedAt: new Date().toISOString(),
        updatedBy: user,
      };
      if (existingIndex >= 0) {
        newData[existingIndex] = updated;
      } else {
        newData.push(updated);
      }
      return updated;
    };

    const updatedEntry = updateOrAddEntry(entry);
    const updatedNextEntry = updateOrAddEntry(nextEntry);

    setData(newData);
    try {
      await Promise.all([saveData(updatedEntry), saveData(updatedNextEntry)]);
      setSelectedDate(null);
    } catch {
      toast.error('Erro ao salvar dados.');
    }
  };

  const getEntryForDate = (dateStr: string) => {
    const existing = data.find((d) => d.date === dateStr && d.block === block && d.hotelId === hotelId);
    if (existing) {
      return {
        ...existing,
        items: {
          ...createEmptyDailyItems(),
          ...existing.items,
        }
      };
    }
    return { date: dateStr, hotelId, block, items: createEmptyDailyItems() };
  };

  const exportToCSV = () => {
    const headers = ['Data'];
    ITEMS.forEach(item => {
      headers.push(`${item.label} (Env)`);
      headers.push(`${item.label} (Rec)`);
      headers.push(`${item.label} (Acum)`);
    });

    const rows = [headers.join(',')];

    for (let i = 1; i <= daysInMonth; i++) {
      const day = i;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry = getEntryForDate(dateStr);

      const rowData = [`${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`];

      ITEMS.forEach(item => {
        const env = entry.items[item.id]?.enviado || 0;
        const rec = entry.items[item.id]?.recebido || 0;
        
        let acum = 0;
        for (let d = 1; d <= day; d++) {
          const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dEntry = getEntryForDate(dStr);
          acum += ((dEntry.items[item.id]?.recebido || 0) - (dEntry.items[item.id]?.enviado || 0));
        }

        rowData.push(env.toString());
        rowData.push(rec.toString());
        rowData.push(acum.toString());
      });

      rows.push(rowData.join(','));
    }

    const csvContent = "\uFEFF" + rows.join('\n'); // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Controle_Lavanderia_Bloco_${block}_${year}_${String(month).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{unitLabel} {block}</h1>
              <p className="text-sm text-gray-500">{monthLabel} de {year}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {debugInfo && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded hidden md:inline">{debugInfo}</span>
            )}
            <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Lançamentos</span>
            </button>
            <button
              onClick={() => setActiveTab('indicators')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'indicators' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Indicadores</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Inventário</span>
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </button>
            {user.toUpperCase() === 'JONATAN.ALMEIDA' && (
              <button
                onClick={() => setActiveTab('ajustes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'ajustes' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Ajustes & API</span>
              </button>
            )}
          </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'ajustes' && user.toUpperCase() === 'JONATAN.ALMEIDA' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Ajustes da API e Sincronização em Nuvem</h2>
                <p className="text-sm text-slate-500">Acesso restrito habilitado exclusivamente para o administrador <strong>{user}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    Sincronização Bidirecional
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Força o envio de alterações locais pendentes e sincroniza o cache local com os dados mais recentes do PostgreSQL.
                  </p>
                </div>
                <button
                  onClick={handleApiSync}
                  disabled={isSyncingApi}
                  className="w-full bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingApi ? 'animate-spin' : ''}`} />
                  {isSyncingApi ? 'Sincronizando com a Nuvem...' : 'Sincronizar Banco em Nuvem Agora'}
                </button>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Autenticação & Token API</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Token JWT ativo para autenticação segura nas requisições do banco de dados em nuvem.
                  </p>
                  <div className="space-y-3">
                    <textarea
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Nenhum token ativo no momento..."
                      className="w-full text-xs font-mono bg-white p-2.5 rounded border border-slate-300 text-slate-700 h-20 resize-none focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveToken}
                        className="flex-1 bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-slate-950 transition-colors text-xs"
                      >
                        Salvar Token
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tokenInput);
                          toast.success('Token copiado para a área de transferência!');
                        }}
                        className="bg-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg hover:bg-slate-300 transition-colors text-xs"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conexão Vercel API / Postgres Ativa
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'overview' && (
          <Overview data={currentData} month={month} year={year} block={block} hotelId={hotelId} customPrices={prices} />
        )}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      Data
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                    {ITEMS.map((item) => (
                      <th key={item.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                        {item.label}
                        <div className="grid grid-cols-3 gap-2 mt-1 text-[10px] text-gray-400">
                          <span>Env</span>
                          <span>Rec</span>
                          <span>Acum</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const entry = getEntryForDate(dateStr);
                    const isWeekend = new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6;

                    // Calculate accumulated difference up to this day
                    const getAcumulado = (itemId: ItemType) => {
                      let acum = 0;
                      for (let d = 1; d <= day; d++) {
                        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const dEntry = getEntryForDate(dStr);
                        acum += ((dEntry.items[itemId]?.recebido || 0) - (dEntry.items[itemId]?.enviado || 0));
                      }
                      return acum;
                    };

                    return (
                      <tr key={day} className={`hover:bg-blue-50 transition-colors ${isWeekend ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-100">
                          {String(day).padStart(2, '0')}/{String(month).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <button
                            onClick={() => setSelectedDate(dateStr)}
                            className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                            title="Editar lançamento"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                        {ITEMS.map((item) => {
                          const env = entry.items[item.id]?.enviado || 0;
                          const rec = entry.items[item.id]?.recebido || 0;
                          const acum = getAcumulado(item.id);
                          return (
                            <td key={item.id} className="px-4 py-3 whitespace-nowrap text-sm border-l border-gray-200">
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <span className={env > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>{env}</span>
                                <span className={rec > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>{rec}</span>
                                <span className={`font-bold ${acum > 0 ? 'text-green-600' : acum < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                  {acum > 0 ? `+${acum}` : acum}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}
        {activeTab === 'indicators' && (
          <Indicators data={currentData} month={month} year={year} hotelId={hotelId} customPrices={prices} block={block} />
        )}
        {activeTab === 'inventory' && (
          <Inventory block={block} month={month} year={year} hotelId={hotelId} />
        )}
      </main>

      <footer className="w-full py-6 px-4 bg-gray-50 border-t border-gray-200 mt-auto shrink-0">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed font-medium max-w-4xl mx-auto">
          <strong>Todos os direitos reservados à Lagoa Parques e Hotéis - Caldas Novas - GO &copy;.</strong><br/>
          É expressamente proibido ceder ou compartilhar o acesso a este aplicativo com terceiros. A cópia, distribuição ou uso não autorizado constitui infração, sujeita às penalidades da Lei do Software (Lei nº 9.609/1998).
        </p>
      </footer>

      {selectedDate && (
        <DailyForm
          entry={getEntryForDate(selectedDate)}
          nextEntry={getEntryForDate((() => {
            const [y, m, d] = selectedDate.split('-').map(Number);
            const date = new Date(y, m - 1, d + 1);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          })())}
          onSave={handleSaveEntry}
          onCancel={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};
