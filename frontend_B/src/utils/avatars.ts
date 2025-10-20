// frontend_B/src/utils/avatars.ts
// Générateur d'avatars par défaut avec des SVG simples

export interface Avatar {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

export const DEFAULT_AVATARS: Avatar[] = [
  { id: 1, name: 'Astronaut', emoji: '🚀', color: '#FF6B6B' },
  { id: 2, name: 'Robot', emoji: '🤖', color: '#4ECDC4' },
  { id: 3, name: 'Alien', emoji: '👽', color: '#95E1D3' },
  { id: 4, name: 'Ninja', emoji: '🥷', color: '#F38181' },
  { id: 5, name: 'Wizard', emoji: '🧙', color: '#AA96DA' },
  { id: 6, name: 'Pirate', emoji: '🏴‍☠️', color: '#FCBAD3' },
  { id: 7, name: 'Knight', emoji: '⚔️', color: '#FFFFD2' },
  { id: 8, name: 'Dragon', emoji: '🐉', color: '#A8D8EA' },
  { id: 9, name: 'Phoenix', emoji: '🔥', color: '#FFAAAA' },
  { id: 10, name: 'Star', emoji: '⭐', color: '#FFD93D' },
];

export const DEFAULT_AVATAR_ID = 1; // Astronaut par défaut

/**
 * Obtenir un avatar par son ID
 */
export function getAvatarById(id: number | string): Avatar {
  const avatarId = typeof id === 'string' ? parseInt(id, 10) : id;
  return DEFAULT_AVATARS.find(a => a.id === avatarId) || DEFAULT_AVATARS[0];
}

/**
 * Obtenir l'URL de l'avatar à partir de la valeur stockée en DB
 * Si c'est un nombre (1-10), retourner l'avatar par défaut
 * Si c'est un emoji, le retourner directement
 * Si c'est un chemin /uploads/..., on ignore (ancien système)
 */
export function getAvatarDisplay(avatarValue: string | null | undefined): { type: 'emoji' | 'default', value: string, color?: string } {
  if (!avatarValue) {
    const defaultAvatar = DEFAULT_AVATARS[0];
    return { type: 'default', value: defaultAvatar.emoji, color: defaultAvatar.color };
  }

  // Si c'est un chemin d'upload, utiliser l'avatar par défaut
  if (avatarValue.startsWith('/uploads/')) {
    const defaultAvatar = DEFAULT_AVATARS[0];
    return { type: 'default', value: defaultAvatar.emoji, color: defaultAvatar.color };
  }

  // Si c'est un nombre (ID d'avatar), récupérer l'avatar correspondant
  const avatarId = parseInt(avatarValue, 10);
  if (!isNaN(avatarId) && avatarId >= 1 && avatarId <= DEFAULT_AVATARS.length) {
    const avatar = getAvatarById(avatarId);
    return { type: 'default', value: avatar.emoji, color: avatar.color };
  }

  // Sinon c'est un emoji personnalisé
  return { type: 'emoji', value: avatarValue };
}
