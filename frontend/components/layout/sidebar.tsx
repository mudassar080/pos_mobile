'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Building2,
  DollarSign,
  FileText,
  Settings,
  TrendingDown,
  TrendingUp,
  Wallet,
  Receipt,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { settingsApi } from '@/lib/api';

type MenuItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  accent: string;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export const menuGroups: MenuGroup[] = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', accent: 'from-indigo-500 to-violet-600' },
    ],
  },
  {
    title: 'Transactions',
    items: [
      { icon: ShoppingCart, label: 'Sales', href: '/sales', accent: 'from-cyan-500 to-blue-600' },
      { icon: TrendingDown, label: 'Sales Returns', href: '/sales/returns', accent: 'from-orange-500 to-amber-600' },
      { icon: Package, label: 'Purchases', href: '/purchases', accent: 'from-blue-500 to-indigo-600' },
      { icon: TrendingUp, label: 'Purchase Returns', href: '/purchases/returns', accent: 'from-purple-500 to-violet-600' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { icon: Package, label: 'Products', href: '/products', accent: 'from-sky-500 to-cyan-600' },
      { icon: Warehouse, label: 'Stock', href: '/stock', accent: 'from-teal-500 to-emerald-600' },
    ],
  },
  {
    title: 'Contacts',
    items: [
      { icon: Users, label: 'Customers', href: '/customers', accent: 'from-pink-500 to-rose-600' },
      { icon: Building2, label: 'Suppliers', href: '/suppliers', accent: 'from-fuchsia-500 to-purple-600' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { icon: DollarSign, label: 'Receivables', href: '/receivables', accent: 'from-amber-500 to-orange-600' },
      { icon: Wallet, label: 'Payables', href: '/payables', accent: 'from-red-500 to-rose-600' },
      { icon: Receipt, label: 'Expenses', href: '/expenses', accent: 'from-rose-500 to-red-600' },
      { icon: TrendingUp, label: 'Other Income', href: '/other-income', accent: 'from-emerald-500 to-green-600' },
      { icon: Wallet, label: 'Owner Management', href: '/investments', accent: 'from-violet-500 to-indigo-600' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: FileText, label: 'Reports', href: '/reports', accent: 'from-slate-500 to-slate-700' },
      { icon: Settings, label: 'Settings', href: '/settings', accent: 'from-indigo-500 to-blue-600' },
    ],
  },
];

export const menuItems = menuGroups.flatMap((group) => group.items);

const sidebarShellClass =
  'flex h-full flex-col bg-gradient-to-b from-slate-950 via-indigo-950 to-violet-950 text-white';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4">
      {menuGroups.map((group) => (
        <div key={group.title} className="mb-4 last:mb-0">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-indigo-300/50">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200',
                    isActive
                      ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/30 ring-1 ring-white/10'
                      : 'text-indigo-100/65 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                      isActive
                        ? cn('bg-gradient-to-br shadow-md', item.accent)
                        : 'bg-white/5 group-hover:bg-white/10'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isActive ? 'text-white' : 'text-indigo-200/80 group-hover:text-white'
                      )}
                    />
                  </div>
                  <span className={cn('text-sm truncate', isActive && 'font-semibold')}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-violet-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function SidebarBrand() {
  const [shopName, setShopName] = useState('Mobile Shop POS');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await settingsApi.getShopProfile();
        if (res.success && res.data?.shopName) {
          setShopName(res.data.shopName);
        }
      } catch (error) {
        // Keep fallback name
      }
    };

    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.shopName) {
        setShopName(customEvent.detail.shopName);
      }
    };

    loadProfile();
    window.addEventListener('shop-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('shop-profile-updated', handleProfileUpdate);
  }, []);

  return (
    <div className="relative overflow-hidden border-b border-white/10 p-5">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-violet-600/20 to-fuchsia-600/10" />
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-violet-500/20 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
          <ShoppingCart className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight">{shopName}</h1>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-indigo-200/70">
            <Sparkles className="h-3 w-3 text-violet-300" />
            <span>POS System</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarFooter() {
  return (
    <div className="border-t border-white/10 p-4">
      <div className="rounded-xl bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-fuchsia-500/20 p-3 ring-1 ring-white/10">
        <p className="text-xs font-medium text-indigo-100">Mobile Shop POS</p>
        <p className="mt-0.5 text-[10px] text-indigo-300/60">Manage sales & inventory easily</p>
      </div>
    </div>
  );
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  return <div className={sidebarShellClass}>{children}</div>;
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 overflow-hidden lg:block">
      <SidebarShell>
        <SidebarBrand />
        <SidebarNav />
        <SidebarFooter />
      </SidebarShell>
    </aside>
  );
}
