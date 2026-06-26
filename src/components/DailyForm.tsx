import React, { useState, useEffect, useRef } from 'react';
import { DailyEntry, ITEMS, ItemType } from '../types';
import { X, Save, Clock, FileText, Send, ArrowDownLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { TableProperties } from 'lucide-react';

interface DailyFormProps {
  entry: DailyEntry;
  nextEntry: DailyEntry;
  onSave: (entry: DailyEntry, nextEntry: DailyEntry) => void;
  onCancel: () => void;
}

export const DailyForm: React.FC<DailyFormProps> = ({ entry, nextEntry, onSave, onCancel }) => {
  const [formData, setFormData] = useState<DailyEntry>(JSON.parse(JSON.stringify(entry)));
  const [nextFormData, setNextFormData] = useState<DailyEntry>(JSON.parse(JSON.stringify(nextEntry)));
  const initialDataStr = useRef(JSON.stringify({ entry, nextEntry }));
  const [isSaving, setIsSaving] = useState(false);
  const [showSpreadsheetMode, setShowSpreadsheetMode] = useState(false);
  const [spreadsheetTextEnv, setSpreadsheetTextEnv] = useState('');
  const [spreadsheetTextRec, setSpreadsheetTextRec] = useState('');

  // Format date for display (YYYY-MM-DD to DD/MM)
  const [year, month, day] = entry.date.split('-');
  const displayDate = `${day}/${month}/${year}`;
  const shortDate = `${day}/${month}`;
  
  const [, nextMonth, nextDay] = nextEntry.date.split('-');
  const shortNextDate = `${nextDay}/${nextMonth}`;

  // Keyboard shortcut Ctrl+S and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, nextFormData]);



  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleChange = (itemId: ItemType, field: 'enviado' | 'recebido', value: number) => {
    if (field === 'enviado') {
      setFormData((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [itemId]: {
            ...(prev.items[itemId] || { enviado: 0, recebido: 0 }),
            enviado: Math.max(0, value),
          },
        },
      }));
    } else {
      setNextFormData((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [itemId]: {
            ...(prev.items[itemId] || { enviado: 0, recebido: 0 }),
            recebido: Math.max(0, value),
          },
        },
      }));
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    onSave(formData, nextFormData);
    initialDataStr.current = JSON.stringify({ entry: formData, nextEntry: nextFormData });
    toast.success('Lançamento salvo com sucesso!');
    setIsSaving(false);
  };

  const handleApplySpreadsheet = (target: 'enviado' | 'recebido') => {
    const text = target === 'enviado' ? spreadsheetTextEnv : spreadsheetTextRec;
    if (!text.trim()) return;

    // Split rows by newline and columns by tab or spaces (often just newline if one column)
    const values = text.split(/[\n\t]+/).map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    
    if (values.length === 0) {
      toast.error('Nenhum número válido encontrado na colagem.');
      return;
    }

    if (target === 'enviado') {
      const newForm = { ...formData, items: { ...formData.items } };
      ITEMS.forEach((item, index) => {
        if (values[index] !== undefined) {
           newForm.items[item.id] = { ...(newForm.items[item.id] || { recebido: 0 }), enviado: Math.max(0, values[index]) };
        }
      });
      setFormData(newForm);
      toast.success('Valores de Enviado aplicados com sucesso!');
    } else {
      const newNextForm = { ...nextFormData, items: { ...nextFormData.items } };
      ITEMS.forEach((item, index) => {
        if (values[index] !== undefined) {
           newNextForm.items[item.id] = { ...(newNextForm.items[item.id] || { enviado: 0 }), recebido: Math.max(0, values[index]) };
        }
      });
      setNextFormData(newNextForm);
      toast.success('Valores de Recebido aplicados com sucesso!');
    }
  };



  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Romaneio de Lavanderia', 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Data: ${displayDate}`, 14, 30);
    doc.text(`Bloco: ${entry.block}`, 14, 36);
    doc.text(`Responsável: ${entry.updatedBy || 'Não preenchido'}`, 14, 42);

    const tableData = ITEMS.map(item => {
      const env = formData.items[item.id]?.enviado || 0;
      const rec = nextFormData.items[item.id]?.recebido || 0;
      return [item.label, env, rec];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Item', 'Enviado', 'Recebido']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }, // Navy color for the PDF header
    });

    // Signatures
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    doc.text('_________________________________', 20, finalY + 30);
    doc.text('Assinatura da Governança', 20, finalY + 36);

    doc.text('_________________________________', 110, finalY + 30);
    doc.text('Assinatura da Lavanderia', 110, finalY + 36);

    doc.save(`romaneio_bloco_${entry.block}_${entry.date}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col md:items-center md:justify-center z-[100]">
      {/* Mobile-first bottom sheet style for small screens, centered card for desktop */}
      <div className="bg-[#fdfdfc] w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 shadow-sm">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Operação de Rouparia</h2>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Lançamento • {displayDate} • Bloco {entry.block}</p>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#fafaf9]">
          
          {entry.updatedAt && entry.updatedBy && (
            <div className="mb-6 bg-slate-100/50 rounded-xl p-3 flex items-center gap-3 text-xs text-slate-500 border border-slate-200">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Última interação em <strong className="text-slate-700">{formatDateTime(entry.updatedAt)}</strong> por <strong className="text-slate-700">{entry.updatedBy}</strong>
              </span>
            </div>
          )}

          <div className="space-y-4">
            {ITEMS.map((item) => {
              const env = formData.items[item.id]?.enviado || 0;
              const rec = nextFormData.items[item.id]?.recebido || 0;

              return (
                <div key={item.id} className="bg-white rounded-xl p-3 sm:p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-between gap-3 sm:gap-4">
                  
                  {/* Item Label */}
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">{item.label}</h3>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex gap-2 sm:gap-4 w-auto">
                    
                    {/* Enviado (Send to Laundry) */}
                    <div className="bg-orange-50/50 rounded-lg p-2 border border-orange-100 min-w-[80px] sm:min-w-[100px]">
                       <div className="flex justify-center items-center mb-1">
                           <span className="text-sm uppercase tracking-wider font-bold text-orange-600 flex flex-col items-center gap-1">
                               <div className="flex items-center gap-1.5"><Send className="w-4 h-4" /> Hoje</div>
                               <span className="opacity-80 text-xs font-semibold">({shortDate})</span>
                           </span>
                       </div>
                       <div className="bg-white rounded-md border border-orange-200 shadow-sm overflow-hidden">
                           <input 
                             type="number" 
                             className="w-full text-center font-bold text-lg text-slate-900 bg-transparent border-none py-1 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none"
                             value={env || ''}
                             onChange={(e) => handleChange(item.id, 'enviado', parseInt(e.target.value) || 0)}
                             onWheel={(e) => e.currentTarget.blur()}
                             placeholder="0"
                           />
                       </div>
                    </div>

                    {/* Recebido (Return) */}
                    <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100 min-w-[100px] sm:min-w-[140px]">
                       <div className="flex justify-center items-center mb-1 text-center">
                           <span className="text-sm uppercase tracking-wider font-bold text-emerald-600 flex flex-col items-center gap-1">
                               <div className="flex items-center gap-1.5"><ArrowDownLeft className="w-4 h-4" /> Amanhã</div>
                               <span className="opacity-80 text-xs font-semibold">({shortNextDate})</span>
                           </span>
                       </div>
                       <div className="bg-white rounded-md border border-emerald-200 shadow-sm overflow-hidden">
                           <input 
                             type="number" 
                             className="w-full text-center font-bold text-lg text-slate-900 bg-transparent border-none py-1 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none"
                             value={rec || ''}
                             onChange={(e) => handleChange(item.id, 'recebido', parseInt(e.target.value) || 0)}
                             onWheel={(e) => e.currentTarget.blur()}
                             placeholder="0"
                           />
                       </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 mb-4 flex justify-center">
             <button
               onClick={generatePDF}
               className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex justify-center items-center gap-2"
             >
               <FileText className="w-5 h-5" />
               Gerar Romaneio em PDF
             </button>
             <button
               onClick={() => setShowSpreadsheetMode(!showSpreadsheetMode)}
               className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 border-2 ${showSpreadsheetMode ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}`}
             >
               <TableProperties className="w-5 h-5" />
               Modo Planilha
             </button>
          </div>

          {showSpreadsheetMode && (
            <div className="mb-8 p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-indigo-600" />
                Modo Planilha (Preenchimento em Lote)
              </h3>
              <p className="text-sm text-indigo-700 mb-6">Copie uma coluna do Excel (contendo apenas os números em ordem) e cole nos campos abaixo. O sistema aplicará os valores para cada item na mesma sequência.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                  <label className="block text-sm font-bold text-orange-700 mb-2">Cole a coluna de Hoje (Enviado):</label>
                  <textarea 
                    className="w-full h-32 text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                    placeholder="Ex:&#10;10&#10;25&#10;0&#10;15..."
                    value={spreadsheetTextEnv}
                    onChange={(e) => setSpreadsheetTextEnv(e.target.value)}
                  />
                  <button 
                    onClick={() => handleApplySpreadsheet('enviado')}
                    className="mt-3 w-full py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold rounded-lg transition-colors"
                  >
                    Aplicar no Enviado
                  </button>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                  <label className="block text-sm font-bold text-emerald-700 mb-2">Cole a coluna de Amanhã (Recebido):</label>
                  <textarea 
                    className="w-full h-32 text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                    placeholder="Ex:&#10;10&#10;25&#10;0&#10;15..."
                    value={spreadsheetTextRec}
                    onChange={(e) => setSpreadsheetTextRec(e.target.value)}
                  />
                  <button 
                    onClick={() => handleApplySpreadsheet('recebido')}
                    className="mt-3 w-full py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg transition-colors"
                  >
                    Aplicar no Recebido
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="p-4 sm:px-6 sm:py-5 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] relative z-10 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all"
          >
            Voltar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-[2] py-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-70"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Salvando...' : 'Salvar Lançamento'}
          </button>
        </div>

      </div>
    </div>
  );
};
