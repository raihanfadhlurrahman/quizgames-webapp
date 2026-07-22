export interface AvatarOption {
  id: string;
  url: string;
  label: string;
}

export const AVAILABLE_AVATARS: AvatarOption[] = Array.from({ length: 20 }, (_, i) => ({
  id: `pp-${i + 1}`,
  url: `/image/pp/${i + 1}.png`,
  label: `Avatar Karakter ${i + 1}`,
}));

export const DEFAULT_AVATAR = '/image/pp/1.png';
