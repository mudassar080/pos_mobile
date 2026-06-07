'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings as SettingsIcon,
  Store,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { settingsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ColorCard,
  SalesPageHero,
  SETTINGS_GRADIENT,
  settingsBtnPrimary,
  settingsBtnSecondary,
  SummaryStat,
} from '@/components/settings/settings-ui';

export default function SettingsPage() {
  const { toast } = useToast();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [shopProfile, setShopProfile] = useState({
    shopName: '',
    phone: '',
    email: '',
    address: '',
  });

  const fetchShopProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await settingsApi.getShopProfile();
      if (res.success && res.data) {
        const updatedProfile = {
          shopName: res.data.shopName || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          address: res.data.address || '',
        };
        setShopProfile(updatedProfile);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('shop-profile-updated', {
              detail: updatedProfile,
            })
          );
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load shop profile',
        variant: 'destructive',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveShopProfile = async () => {
    if (!shopProfile.shopName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Shop name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingProfile(true);
      const res = await settingsApi.saveShopProfile(shopProfile);
      if (res.success && res.data) {
        const updatedProfile = {
          shopName: res.data.shopName || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          address: res.data.address || '',
        };
        setShopProfile(updatedProfile);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('shop-profile-updated', {
              detail: updatedProfile,
            })
          );
        }
      }
      toast({
        title: 'Success',
        description: 'Shop profile saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save shop profile',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    fetchShopProfile();
  }, []);

  const profileReady = !loadingProfile && shopProfile.shopName.trim().length > 0;

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Settings"
          description="Configure your shop profile and POS preferences"
          badge="Configuration"
          gradient={SETTINGS_GRADIENT}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat
            label="Shop Name"
            value={loadingProfile ? '-' : shopProfile.shopName || 'Not set'}
            icon={Store}
            theme="bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-900 ring-1 ring-indigo-100"
          />
          <SummaryStat
            label="Phone"
            value={loadingProfile ? '-' : shopProfile.phone || '—'}
            icon={Phone}
            theme="bg-gradient-to-br from-blue-50 to-cyan-100 text-blue-900 ring-1 ring-blue-100"
          />
          <SummaryStat
            label="Email"
            value={loadingProfile ? '-' : shopProfile.email || '—'}
            icon={Mail}
            theme="bg-gradient-to-br from-violet-50 to-purple-100 text-violet-900 ring-1 ring-violet-100"
          />
          <SummaryStat
            label="Profile Status"
            value={loadingProfile ? '-' : profileReady ? 'Complete' : 'Incomplete'}
            icon={SettingsIcon}
            theme={
              profileReady
                ? 'bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 ring-1 ring-emerald-100'
                : 'bg-gradient-to-br from-amber-50 to-orange-100 text-amber-900 ring-1 ring-amber-100'
            }
          />
        </div>

        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="h-auto w-full sm:w-auto flex flex-wrap gap-1 rounded-2xl bg-slate-100/80 p-1.5">
            <TabsTrigger
              value="shop"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700"
            >
              <Store className="w-4 h-4 mr-2" />
              Shop Profile
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              System Settings
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700"
            >
              <Database className="w-4 h-4 mr-2" />
              Data Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop">
            <ColorCard
              title="Shop Information"
              headerClassName="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100/50 text-indigo-900"
            >
              {loadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-5 max-w-2xl">
                  <div>
                    <Label htmlFor="shopName" className="text-slate-700">
                      Shop Name *
                    </Label>
                    <div className="relative mt-1.5">
                      <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                      <Input
                        id="shopName"
                        value={shopProfile.shopName}
                        onChange={(e) =>
                          setShopProfile((prev) => ({ ...prev, shopName: e.target.value }))
                        }
                        placeholder="Enter shop name"
                        className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-slate-700">
                        Phone
                      </Label>
                      <div className="relative mt-1.5">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                        <Input
                          id="phone"
                          value={shopProfile.phone}
                          onChange={(e) =>
                            setShopProfile((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          placeholder="Enter phone number"
                          className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-slate-700">
                        Email
                      </Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                        <Input
                          id="email"
                          value={shopProfile.email}
                          onChange={(e) =>
                            setShopProfile((prev) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder="Enter email"
                          className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-slate-700">
                      Address
                    </Label>
                    <div className="relative mt-1.5">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-indigo-400" />
                      <Textarea
                        id="address"
                        value={shopProfile.address}
                        onChange={(e) =>
                          setShopProfile((prev) => ({ ...prev, address: e.target.value }))
                        }
                        placeholder="Enter address"
                        rows={3}
                        className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white resize-none"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveShopProfile}
                    disabled={savingProfile}
                    className={settingsBtnPrimary}
                  >
                    {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Save Shop Details
                  </Button>
                </div>
              )}
            </ColorCard>
          </TabsContent>

          <TabsContent value="system">
            <ColorCard
              title="System Configuration"
              headerClassName="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100/50 text-blue-900"
            >
              <div className="space-y-6 max-w-2xl">
                <div>
                  <Label htmlFor="lowStock" className="text-slate-700">
                    Low Stock Threshold
                  </Label>
                  <Input
                    id="lowStock"
                    type="number"
                    defaultValue="5"
                    className="mt-1.5 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white max-w-xs"
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    Get alerts when stock falls below this number
                  </p>
                </div>

                <Button className={settingsBtnPrimary}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </ColorCard>
          </TabsContent>

          <TabsContent value="data">
            <ColorCard
              title="Data Management"
              headerClassName="bg-gradient-to-r from-slate-50 to-indigo-50 border-slate-100/50 text-slate-900"
            >
              <div className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-white to-blue-50/50 ring-1 ring-blue-100 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-100 p-2.5 shrink-0">
                      <FileSpreadsheet className="h-5 w-5 text-blue-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">Export Data</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Download all your data as Excel or PDF files
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button variant="outline" className={settingsBtnSecondary}>
                          <Download className="w-4 h-4 mr-2" />
                          Export as Excel
                        </Button>
                        <Button variant="outline" className={settingsBtnSecondary}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export as PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-white to-emerald-50/50 ring-1 ring-emerald-100 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2.5 shrink-0">
                      <Database className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">Backup Data</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Create a backup of your entire database
                      </p>
                      <Button variant="outline" className={cn('mt-4', settingsBtnSecondary)}>
                        <Download className="w-4 h-4 mr-2" />
                        Create Backup
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 ring-1 ring-red-200 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-red-100 p-2.5 shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-red-900">Danger Zone</h3>
                      <p className="text-sm text-red-700 mt-1">
                        These actions cannot be undone
                      </p>
                      <Button variant="destructive" className="mt-4 rounded-xl">
                        Clear All Data
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ColorCard>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
