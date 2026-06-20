import React, { useState, useEffect, useRef } from 'react';
import { InventoryEntry, ITEMS, ItemType, createEmptyInventoryItems, InventoryItemData } from '../types';
import { loadInventory, saveInventory } from '../lib/storage';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryProps {
  block: string;
  month: number;
  year: number;
  hotelId: string;
}

const getInventoryItem = (inv: InventoryEntry, itemId: ItemType): InventoryItemData => {
  const val = inv.items[itemId];
  if (typeof val === 'number') {
    return { hotel: val, lavanderia: 0, danificado: 0 };
  }
  return val || { hotel: 0, lavanderia: 0, danificado: 0 };
};

export const Inventory: React.FC<InventoryProps> = ({ block, month, year, hotelId }) => {
  const [inventoryList, setInventoryList] = useState<InventoryEntry[]>([]);
  const [currentInventory, setCurrentInventory] = useState<InventoryEntry>({
    hotelId,
    block,
    month,
    year,
    items: createEmptyInventoryItems(),
  });
  const [saved, setSaved] = useState(false);
  const initialDataStr = useRef(JSON.stringify(createEmptyInventoryItems()));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadInventory().then(remoteData => {
      setInventoryList(remoteData);
    });
  }, []);

  useEffect(() => {
    const existing = inventoryList.find(
      (inv) => inv.block === block && inv.month === month && inv.year === year && inv.hotelId === hotelId
    );
    if (existing) {
      setCurrentInventory(existing);
    } else {
      setCurrentInventory({
        hotelId,
        block,
        month,
        year,
        items: createEmptyInventoryItems(),
      });
    }
    initialDataStr.current = JSON.stringify(existing ? existing.items : createEmptyInventoryItems());
    setSaved(false);
  }, [block, month, year, inventoryList]);

  // Debounced Auto-save
  useEffect(() => {
    const currentDataStr = JSON.stringify(currentInventory.items);
    if (currentDataStr === initialDataStr.current) return;

    const handler = setTimeout(() => {
      setIsSaving(true);
      handleSave();
      initialDataStr.current = currentDataStr;
      toast.success('Inventário salvo automaticamente!', { position: 'bottom-center' });
      setIsSaving(false);
    }, 1500);

    return () => clearTimeout(handler);
  }, [currentInventory.items]);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentInventory]);

  const handleChange = (itemId: ItemType, field: 'hotel' | 'lavanderia' | 'danificado', value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setCurrentInventory((prev) => {
      const currentItem = getInventoryItem(prev, itemId);
      return {
        ...prev,
        items: {
          ...prev.items,
          [itemId]: {
            ...currentItem,
            [field]: Math.max(0, numValue),
          },
        },
      };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    const newList = [...inventoryList];
    const index = newList.findIndex(
      (inv) => inv.block === block && inv.month === month && inv.year === year && inv.hotelId === hotelId
    );
    
    if (index >= 0) {
      newList[index] = currentInventory;
    } else {
      newList.push(currentInventory);
    }
    
    setInventoryList(newList);
    await saveInventory(currentInventory);
    setSaved(true);
    initialDataStr.current = JSON.stringify(currentInventory.items);
    setTimeout(() => setSaved(false), 3000);
  };

  // Calculate total items
  let totalHotel = 0;
  let totalLavanderia = 0;
  let totalDanificado = 0;
  ITEMS.forEach(item => {
    const data = getInventoryItem(currentInventory, item.id);
    totalHotel += data.hotel;
    totalLavanderia += data.lavanderia;
    totalDanificado += data.danificado;
  });
  const totalGeral = totalHotel + totalLavanderia + totalDanificado;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Inventário Físico</h3>
            <p className="text-sm text-gray-500">Contagem de enxoval no final do mês</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Inventário'}
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map((item) => {
              const itemData = getInventoryItem(currentInventory, item.id);
              return (
                <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    {item.label}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Hotel</label>
                        <input
                          type="number"
                          min="0"
                          value={itemData.hotel || ''}
                          onChange={(e) => handleChange(item.id, 'hotel', e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 px-2 border bg-white text-gray-900 font-bold text-lg [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Lavanderia</label>
                        <input
                          type="number"
                          min="0"
                          value={itemData.lavanderia || ''}
                          onChange={(e) => handleChange(item.id, 'lavanderia', e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 px-2 border bg-white text-gray-900 font-bold text-lg [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider truncate" title="Danificado/Rasgado">Danificado</label>
                        <input
                          type="number"
                          min="0"
                          value={itemData.danificado || ''}
                          onChange={(e) => handleChange(item.id, 'danificado', e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 py-1.5 px-2 border bg-white text-red-700 font-bold text-lg [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-semibold text-blue-900">Total de Peças em Estoque:</span>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <div className="text-blue-600 font-medium mb-1">Hotel</div>
                <div className="text-xl font-bold text-blue-800">{totalHotel}</div>
              </div>
              <div className="text-center">
                <div className="text-blue-600 font-medium mb-1">Lavanderia</div>
                <div className="text-xl font-bold text-blue-800">{totalLavanderia}</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-medium mb-1">Danificado</div>
                <div className="text-xl font-bold text-red-800">{totalDanificado}</div>
              </div>
              <div className="text-center border-l border-blue-200 pl-6">
                <div className="text-blue-600 font-medium mb-1">Total Geral</div>
                <div className="text-xl font-bold text-blue-800">{totalGeral}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
