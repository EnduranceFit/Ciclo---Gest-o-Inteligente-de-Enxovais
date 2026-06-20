import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { ITEMS, ItemType, ItemPriceConfig, getItemPrice } from '../../types';
import { savePrices } from '../../lib/storage';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';

export const PricingConfig: React.FC = () => {
  const { hotelId, prices, setPrices } = useAppStore();
  
  // Use local state for editing, then save to store
  const [editingPrices, setEditingPrices] = useState<Record<string, any>>(prices || {});
  const [savingPrices, setSavingPrices] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', washingPrice: '', replacementPrice: '' });

  const handlePriceChange = (itemId: string, field: 'washingPrice' | 'replacementPrice', value: string) => {
    setEditingPrices(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { 
          washingPrice: ITEMS.find(i => i.id === itemId)?.washingPrice || 0, 
          replacementPrice: getItemPrice(itemId as ItemType, hotelId!) || 0 
        }),
        [field]: value
      }
    }));
  };

  const handleSavePrices = async () => {
    if (!hotelId) return;
    setSavingPrices(true);

    // Parse all strings to numbers before saving
    const parsedPrices: Record<string, ItemPriceConfig> = {};
    for (const [id, cfg] of Object.entries(editingPrices)) {
      parsedPrices[id] = {
        ...cfg,
        washingPrice: typeof cfg.washingPrice === 'string' ? parseFloat(cfg.washingPrice) || 0 : cfg.washingPrice,
        replacementPrice: typeof cfg.replacementPrice === 'string' ? parseFloat(cfg.replacementPrice) || 0 : cfg.replacementPrice,
      };
    }

    await savePrices(hotelId, parsedPrices);
    setPrices(parsedPrices);
    setSavingPrices(false);
    toast.success('Preços salvos com sucesso!');
  };

  const handleAddCustomItem = () => {
    const trimmed = newItem.label.trim();
    if (!trimmed) { toast.error('Informe o nome do item.'); return; }
    const id = `custom_${Date.now()}`;
    setEditingPrices(prev => ({
      ...prev,
      [id]: {
        washingPrice: parseFloat(newItem.washingPrice) || 0,
        replacementPrice: parseFloat(newItem.replacementPrice) || 0,
        isCustom: true,
        label: trimmed
      }
    }));
    setNewItem({ label: '', washingPrice: '', replacementPrice: '' });
  };

  const handleRemoveCustomItem = (id: string) => {
    setEditingPrices(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  return (
    <div className="space-y-8">
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
                const currentRep = editingPrices[item.id]?.replacementPrice ?? (getItemPrice(item.id, hotelId!) || 0);
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 text-sm">{item.label}</td>
                    <td className="py-3 px-4">
                      <input type="number" min="0" step="0.01" value={currentWash === 0 ? '' : currentWash}
                        onChange={(e) => handlePriceChange(item.id, 'washingPrice', e.target.value)}
                        className="w-full py-2 px-3 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input type="number" min="0" step="0.01" value={currentRep === 0 ? '' : currentRep}
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
                        <input type="number" min="0" step="0.01" value={cfg.washingPrice === 0 ? '' : cfg.washingPrice}
                          onChange={(e) => handlePriceChange(id, 'washingPrice', e.target.value)}
                          className="w-full py-2 px-3 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input type="number" min="0" step="0.01" value={cfg.replacementPrice === 0 ? '' : cfg.replacementPrice}
                          onChange={(e) => handlePriceChange(id, 'replacementPrice', e.target.value)}
                          className="w-full py-2 px-3 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleRemoveCustomItem(id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
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
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center mb-4">
            <p className="text-sm text-slate-500">Nenhum item extra configurado.</p>
          </div>
        )}

        {/* Add new custom item form */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Adicionar Novo Item</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Nome do item (ex: Toalha de Piscina)"
              value={newItem.label}
              onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
              className="flex-1 py-2 px-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="R$ Lavagem"
              value={newItem.washingPrice}
              onChange={(e) => setNewItem({ ...newItem, washingPrice: e.target.value })}
              className="w-full sm:w-32 py-2 px-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="R$ Reposição"
              value={newItem.replacementPrice}
              onChange={(e) => setNewItem({ ...newItem, replacementPrice: e.target.value })}
              className="w-full sm:w-32 py-2 px-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleAddCustomItem}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
