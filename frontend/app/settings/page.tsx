'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Store, Settings as SettingsIcon, Download, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { settingsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
        setShopProfile({
          shopName: res.data.shopName || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          address: res.data.address || '',
        });
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">Configure your POS system</p>
        </div>

        <Tabs defaultValue="shop">
          <TabsList>
            <TabsTrigger value="shop">Shop Profile</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
            {/* <TabsTrigger value="payment">Payment Modes</TabsTrigger> */}
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Shop Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Shop Name</Label>
                    <Input
                      value={shopProfile.shopName}
                      onChange={(e) =>
                        setShopProfile((prev) => ({ ...prev, shopName: e.target.value }))
                      }
                      placeholder="Enter shop name"
                      disabled={loadingProfile}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={shopProfile.phone}
                        onChange={(e) =>
                          setShopProfile((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="Enter phone number"
                        disabled={loadingProfile}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={shopProfile.email}
                        onChange={(e) =>
                          setShopProfile((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="Enter email"
                        disabled={loadingProfile}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea
                      value={shopProfile.address}
                      onChange={(e) =>
                        setShopProfile((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="Enter address"
                      rows={3}
                      disabled={loadingProfile}
                    />
                  </div>
                  {/* <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>GST Number</Label>
                      <Input placeholder="Enter GST number" />
                    </div>
                    <div>
                      <Label>PAN Number</Label>
                      <Input placeholder="Enter PAN number" />
                    </div>
                  </div> */}
                  <Button onClick={handleSaveShopProfile} disabled={loadingProfile || savingProfile}>
                    {(loadingProfile || savingProfile) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    <Save className="w-4 h-4 mr-2" />
                    Save Shop Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* <div>
                    <Label>Currency</Label>
                    <Select defaultValue="inr">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inr">INR (PKR)</SelectItem>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}

                  {/* <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Tax</Label>
                        <p className="text-sm text-slate-600">
                          Apply tax to all sales
                        </p>
                      </div>
                      <Switch checked={taxEnabled} onCheckedChange={setTaxEnabled} />
                    </div>

                    {taxEnabled && (
                      <div>
                        <Label>Tax Rate (%)</Label>
                        <Input type="number" defaultValue="18" />
                      </div>
                    )}
                  </div> */}

                  {/* <div>
                    <Label>Date Format</Label>
                    <Select defaultValue="dd-mm-yyyy">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                        <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}

                  <div>
                    <Label>Low Stock Threshold</Label>
                    <Input type="number" defaultValue="5" />
                    <p className="text-sm text-slate-600 mt-1">
                      Get alerts when stock falls below this number
                    </p>
                  </div>

                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* <TabsContent value="payment" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Mode Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Cash Payment</Label>
                      <p className="text-sm text-slate-600">
                        Accept cash payments
                      </p>
                    </div>
                    <Switch checked={cashEnabled} onCheckedChange={setCashEnabled} />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>UPI Payment</Label>
                      <p className="text-sm text-slate-600">
                        Accept UPI payments
                      </p>
                    </div>
                    <Switch checked={upiEnabled} onCheckedChange={setUpiEnabled} />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Card Payment</Label>
                      <p className="text-sm text-slate-600">
                        Accept card payments
                      </p>
                    </div>
                    <Switch checked={cardEnabled} onCheckedChange={setCardEnabled} />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Credit Sales</Label>
                      <p className="text-sm text-slate-600">
                        Allow credit sales to customers
                      </p>
                    </div>
                    <Switch
                      checked={creditEnabled}
                      onCheckedChange={setCreditEnabled}
                    />
                  </div>

                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Save Payment Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}

          <TabsContent value="data" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Export Data</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Download all your data as Excel or PDF files
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export as Excel
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export as PDF
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Backup Data</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Create a backup of your entire database
                    </p>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Create Backup
                    </Button>
                  </div>

                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h3 className="font-semibold mb-2 text-red-900">
                      Danger Zone
                    </h3>
                    <p className="text-sm text-red-700 mb-4">
                      These actions cannot be undone
                    </p>
                    <Button variant="destructive">Clear All Data</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
