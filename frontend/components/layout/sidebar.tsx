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
  Receipt
} from 'lucide-react';
import { settingsApi } from '@/lib/api';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingCart, label: 'Sales', href: '/sales' },
  { icon: TrendingDown, label: 'Sales Returns', href: '/sales/returns' },
  { icon: Package, label: 'Purchases', href: '/purchases' },
  { icon: TrendingUp, label: 'Purchase Returns', href: '/purchases/returns' },
  { icon: Package, label: 'Products', href: '/products' },
  { icon: Warehouse, label: 'Stock', href: '/stock' },
  { icon: Users, label: 'Customers', href: '/customers' },
  { icon: Building2, label: 'Suppliers', href: '/suppliers' },
  { icon: DollarSign, label: 'Receivables', href: '/receivables' },
  { icon: Wallet, label: 'Payables', href: '/payables' },
  { icon: Receipt, label: 'Expenses', href: '/expenses' },
  { icon: TrendingUp, label: 'Other Income', href: '/other-income' },
  { icon: Wallet, label: 'Owner Management', href: '/investments' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
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
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-slate-900" />
          </div>
          {shopName}
        </h1>
      </div>
      <nav className="p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors',
                isActive
                  ? 'bg-white text-slate-900 font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
