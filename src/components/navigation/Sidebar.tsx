import { IconType } from 'react-icons';
import { FiBook, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
  icon?: IconType;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Orders',
    icon: FiBook,
    children: [
      {
        label: 'Open Orders',
        subLabel: 'View active trading orders',
        href: '/orders?status=open',
        icon: FiClock,
      },
      {
        label: 'Pending Orders',
        subLabel: 'View orders awaiting execution',
        href: '/orders?status=pending',
        icon: FiAlertCircle,
      },
      {
        label: 'Closed Orders',
        subLabel: 'View completed orders',
        href: '/orders?status=closed',
        icon: FiCheckCircle,
      },
    ],
  },
]; 