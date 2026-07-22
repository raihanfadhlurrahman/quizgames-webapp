export interface BorderOption {
  id: number;
  name: string;
  url: string;
}

export const AVAILABLE_BORDERS: BorderOption[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Bingkai ${i + 1}`,
  url: `/image/border/${i + 1}.png`,
}));

export const DEFAULT_BORDER = '/image/border/1.png';
