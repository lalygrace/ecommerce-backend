export type Role = 'ADMIN' | 'SELLER' | 'CUSTOMER' | string;

// Define high-level permissions mapped to roles. Keep this small and easy to extend.
export const rolePermissions: Record<string, string[]> = {
  ADMIN: ['*'],
  SELLER: ['products:create', 'products:update', 'products:delete'],
  CUSTOMER: ['orders:create', 'orders:view_self', 'reviews:create'],
};

export function hasRole(role: string | undefined, expected: string) {
  if (!role) return false;
  return role === expected;
}

export function hasPermission(role: string | undefined, permission: string) {
  if (!role) return false;
  const perms = rolePermissions[role] || [];
  if (perms.includes('*')) return true;
  return perms.includes(permission);
}
