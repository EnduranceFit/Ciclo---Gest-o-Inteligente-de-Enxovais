import React, { useMemo } from 'react';
import { DailyEntry, ITEMS, ItemType, getItemPrice, ItemPriceConfig } from '../types';

interface IndicatorsProps {
  data: DailyEntry[];
  month: number;
  year: number;
  block: string;
  hotelId: string;
  customPrices?: Record<string, ItemPriceConfig>;
}

export const Indicators: React.FC<IndicatorsProps> = ({ data, month, year, hotelId, customPrices }) => {
  const daysInMonth = new Date(year, month, 0).getDate();

  const calculateStats = (startDay: number, endDay: number) => {
    const stats: Record<ItemType, { enviado: number; recebido: number; diferenca: number; custo: number }> = {} as any;
    
    ITEMS.forEach(item => {
      stats[item.id] = { enviado: 0, recebido: 0, diferenca: 0, custo: 0 };
    });

    let totalEnviado = 0;
    let totalRecebido = 0;
    let totalCusto = 0;

    data.forEach(entry => {
      const day = parseInt(entry.date.split('-')[2], 10);
      if (day >= startDay && day <= endDay) {
        ITEMS.forEach(item => {
          const env = entry.items[item.id]?.enviado || 0;
          const rec = entry.items[item.id]?.recebido || 0;
          stats[item.id].enviado += env;
          stats[item.id].recebido += rec;
          stats[item.id].diferenca += (rec - env);
          
          totalEnviado += env;
          totalRecebido += rec;
        });
      }
    });

    // Calculate missing pieces cost
    ITEMS.forEach(item => {
      const faltantes = Math.max(0, stats[item.id].enviado - stats[item.id].recebido);
      const itemReplacementPrice = customPrices?.[item.id]?.replacementPrice ?? (getItemPrice(item.id as ItemType, hotelId) || 0);
      stats[item.id].custo = faltantes * itemReplacementPrice;
      totalCusto += stats[item.id].custo;
    });

    return { stats, totalEnviado, totalRecebido, totalDiferenca: totalRecebido - totalEnviado, totalCusto };
  };

  const q1 = useMemo(() => calculateStats(1, 15), [data]);
  const q2 = useMemo(() => calculateStats(16, daysInMonth), [data, daysInMonth]);
  const mensal = useMemo(() => calculateStats(1, daysInMonth), [data, daysInMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const renderTable = (title: string, periodStats: ReturnType<typeof calculateStats>) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div className="text-sm font-medium text-gray-500 flex flex-wrap gap-x-4 gap-y-2">
          <span>Env: <span className="text-orange-600">{periodStats.totalEnviado}</span></span>
          <span>Rec: <span className="text-green-600">{periodStats.totalRecebido}</span></span>
          <span>Dif: <span className={periodStats.totalDiferenca > 0 ? 'text-green-600' : periodStats.totalDiferenca < 0 ? 'text-red-600' : 'text-gray-900'}>
            {periodStats.totalDiferenca > 0 ? `+${periodStats.totalDiferenca}` : periodStats.totalDiferenca}
          </span></span>
          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
            Prejuízo: {formatCurrency(periodStats.totalCusto)}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Reposição</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Enviado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Recebido</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diferença</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prejuízo Calculado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {ITEMS.map((item) => {
              const stat = periodStats.stats[item.id];
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.label}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                    {(() => {
                      const itemReplacementPrice = customPrices?.[item.id]?.replacementPrice ?? getItemPrice(item.id as ItemType, hotelId);
                      return itemReplacementPrice ? formatCurrency(itemReplacementPrice) : 'A definir';
                    })()}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-orange-600 font-medium">{stat.enviado}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">{stat.recebido}</td>
                  <td className={`px-6 py-3 whitespace-nowrap text-sm text-right font-bold ${stat.diferenca > 0 ? 'text-green-600' : stat.diferenca < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {stat.diferenca > 0 ? `+${stat.diferenca}` : stat.diferenca}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-red-600 font-bold">
                    {formatCurrency(stat.custo)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderTable('1ª Quinzena (Dia 01 ao 15)', q1)}
      {renderTable(`2ª Quinzena (Dia 16 ao ${daysInMonth})`, q2)}
      {renderTable('Resumo Mensal', mensal)}

    </div>
  );
};
