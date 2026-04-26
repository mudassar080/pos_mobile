'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Store } from 'lucide-react';
import { settingsApi } from '@/lib/api';

export function Header() {
  const { user, logout } = useAuth();
  const [shopProfile, setShopProfile] = useState<any>({
    shopName: 'Mobile Shop POS',
    address: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await settingsApi.getShopProfile();
        if (res.success && res.data) {
          setShopProfile({
            shopName: res.data.shopName || 'Mobile Shop POS',
            address: res.data.address || '',
          });
        }
      } catch (error) {
        // Keep fallback values in UI
      }
    };

    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail || {};
      setShopProfile({
        shopName: detail.shopName || 'Mobile Shop POS',
        address: detail.address || '',
      });
    };

    loadProfile();
    window.addEventListener('shop-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('shop-profile-updated', handleProfileUpdate);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 left-64 right-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-slate-600" />
          <div>
            <h2 className="font-semibold text-slate-900">{shopProfile.shopName}</h2>
            <p className="text-xs text-slate-500">{shopProfile.address || 'Configure shop address'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.role}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
