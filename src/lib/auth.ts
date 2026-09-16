export const MASTER_ADMIN_EMAIL = 'shashvatshukla81@gmail.com';

export const isMasterAccount = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
};

export const createUserId = (email: string, role: string): string => {
  let hash = 0;
  for (const character of email.trim().toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  const first = String(1000 + (hash % 9000));
  const second = String(1000 + (Math.floor(hash / 9000) % 9000));
  return `BHU-${role.slice(0, 3).toUpperCase()}-${first}-${second}`;
};
