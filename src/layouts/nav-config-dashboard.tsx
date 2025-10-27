import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  roles?: ('admin' | 'user')[]; // Optional: which roles can see this nav item
};

// All available navigation items
const allNavItems: NavItem[] = [
  {
    title: 'Subscription',
    path: '/subscription',
    icon: icon('ic-cart'),
    roles: ['admin', 'user'], // Both can see subscription
  },

];

// Default export for backward compatibility (shows all items)
export const navData = allNavItems;

/**
 * Get navigation items filtered by user role
 * @param userRole - The role of the current user ('admin' or 'user')
 * @returns Filtered navigation items
 */
export const getNavDataByRole = (userRole: 'admin' | 'user' | null): NavItem[] => {
  if (!userRole) {
    // If no role, show only subscription
    return allNavItems.filter((item) => item.path === '/subscription');
  }
  
  return allNavItems.filter((item) => {
    // If no roles specified, show to everyone
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    // Check if user's role is in the allowed roles
    return item.roles.includes(userRole);
  });
};
