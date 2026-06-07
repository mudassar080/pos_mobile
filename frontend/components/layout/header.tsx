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
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { User, LogOut, Store, Menu } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import { SidebarBrand, SidebarFooter, SidebarNav, SidebarShell } from './sidebar';

export function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <header className="h-14 sm:h-16 bg-white/90 backdrop-blur-md border-b border-indigo-100/80 shadow-sm shadow-indigo-100/30 fixed top-0 left-0 lg:left-64 right-0 z-30">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
              >
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 p-0 border-none text-white [&>button]:text-white [&>button]:hover:bg-white/10"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <SidebarShell>
                <SidebarBrand />
                <SidebarNav onNavigate={() => setMobileMenuOpen(false)} />
                <SidebarFooter />
              </SidebarShell>
            </SheetContent>
          </Sheet>

          <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200/50">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{shopProfile.shopName}</h2>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              {shopProfile.address || 'Configure shop address'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-auto px-2 sm:px-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-200/50">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left hidden sm:block">
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
