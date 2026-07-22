export interface BgProfileOption {
  id: number;
  name: string;
  url: string;
}

export const AVAILABLE_BGPROFILES: BgProfileOption[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Background ${i + 1}`,
  url: `/image/bgprofile/${i + 1}.jpg`,
}));

export const DEFAULT_BGPROFILE = '/image/bgprofile/1.jpg';
