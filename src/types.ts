export type ItemType =
  | 'lencol_casal'
  | 'lencol_solteiro'
  | 'fronha'
  | 'toalha_banho'
  | 'toalha_rosto'
  | 'piso'
  | 'toalha_piscina'
  | 'manta'
  | 'colcha_piquet';

export interface ItemData {
  enviado: number;
  recebido: number;
}

export interface ItemPriceConfig {
  washingPrice: number;
  replacementPrice: number;
  /** Only present on manually-added items */
  label?: string;
  isCustom?: boolean;
}

export type DailyItems = Record<ItemType, ItemData>;

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  hotelId: string;
  block: string;
  items: DailyItems;
  updatedAt?: string;
  updatedBy?: string;
}

export interface InventoryItemData {
  hotel: number;
  lavanderia: number;
  danificado: number;
}

export interface InventoryEntry {
  month: number;
  year: number;
  hotelId: string;
  block: string;
  items: Record<ItemType, InventoryItemData>;
}

export interface OperationalMetric {
  month: number;
  year: number;
  hotelId: string;
  uhsOcupadas: number;
}


export interface Hotel {
  id: string;
  name: string;
  unitLabel: string;
  unitLabelPlural: string;
  blocks: string[];
  users: string[];
}

export const HOTELS: Hotel[] = [
  {
    id: 'eco',
    name: 'Lagoa Ecotowers',
    unitLabel: 'Bloco',
    unitLabelPlural: 'Blocos',
    blocks: ['A', 'C', 'D'],
    users: ['ANA LIDIA COSTA', 'GISELE KARINE', 'ADRIANA SILVA']
  },
  {
    id: 'jardins',
    name: 'Lagoa Jardins',
    unitLabel: 'Resort',
    unitLabelPlural: 'Geral',
    blocks: ['ÚNICO'],
    users: ['ANGELA CRISTINA', 'TEREZINHA DE JESUS']
  }
];

export const ITEMS: { id: ItemType; label: string; washingPrice: number }[] = [
  { id: 'lencol_casal', label: 'Lençol Casal', washingPrice: 1.70 },
  { id: 'lencol_solteiro', label: 'Lençol de Solteiro', washingPrice: 1.70 },
  { id: 'fronha', label: 'Fronha', washingPrice: 1.70 },
  { id: 'toalha_banho', label: 'Toalha de Banho', washingPrice: 1.70 },
  { id: 'toalha_rosto', label: 'Toalha de Rosto', washingPrice: 1.70 },
  { id: 'piso', label: 'Piso', washingPrice: 1.70 },
  { id: 'toalha_piscina', label: 'Toalha de Piscina', washingPrice: 1.70 },
  { id: 'manta', label: 'Manta', washingPrice: 4.23 },
  { id: 'colcha_piquet', label: 'Colcha Piquet', washingPrice: 1.70 },
];

export const getItemPrice = (itemId: ItemType, hotelId: string): number | undefined => {
  if (hotelId !== 'eco') return undefined; // Somente Ecotowers tem preco definido

  const prices: Partial<Record<ItemType, number>> = {
    'lencol_casal': 100.00,
    'lencol_solteiro': 67.45,
    'toalha_banho': 29.47,
    'toalha_rosto': 12.42,
    'piso': 12.42,
    'toalha_piscina': 32.00,
    // fronha e manta = undefined (A definir)
  };

  return prices[itemId];
};

export const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export const createEmptyDailyItems = (): DailyItems => {
  const items: Partial<DailyItems> = {};
  ITEMS.forEach((item) => {
    items[item.id] = { enviado: 0, recebido: 0 };
  });
  return items as DailyItems;
};

export const createEmptyInventoryItems = (): Record<ItemType, InventoryItemData> => {
  const items: Partial<Record<ItemType, InventoryItemData>> = {};
  ITEMS.forEach((item) => {
    items[item.id] = { hotel: 0, lavanderia: 0, danificado: 0 };
  });
  return items as Record<ItemType, InventoryItemData>;
};

