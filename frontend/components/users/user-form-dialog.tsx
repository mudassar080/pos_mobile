'use client';

import { Loader2, User, Mail, Lock, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type UserFormData = {
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin' | 'staff';
  isActive: boolean;
};

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  roleLocked?: boolean;
  form: UserFormData;
  onFormChange: (form: UserFormData) => void;
  onSave: () => void;
  saving?: boolean;
};

export function UserFormDialog({
  open,
  onOpenChange,
  editing,
  roleLocked = false,
  form,
  onFormChange,
  onSave,
  saving = false,
}: UserFormDialogProps) {
  const update = (patch: Partial<UserFormData>) => onFormChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-indigo-200/40 max-h-[90vh] overflow-y-auto',
          '[&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white'
        )}
      >
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 pb-6 pt-8 text-white">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                {editing ? 'Edit User' : 'Create User'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-indigo-100">
                {editing
                  ? 'Update account details. Leave password blank to keep the current one.'
                  : 'Add an admin or staff user. Superadmin is only set up on the server.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-6">
          <div>
            <Label htmlFor="user-name" className="text-slate-700">
              Full name *
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
              <Input
                id="user-name"
                className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="user-email" className="text-slate-700">
              Email *
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
              <Input
                id="user-email"
                type="email"
                className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="user-password" className="text-slate-700">
              Password {editing ? '(optional)' : '*'}
            </Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
              <Input
                id="user-password"
                type="password"
                className="rounded-xl border-slate-200 bg-slate-50/50 pl-10 focus:bg-white"
                value={form.password}
                onChange={(e) => update({ password: e.target.value })}
                placeholder={editing ? 'Leave blank to keep current' : 'Min. 6 characters'}
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-700">Role *</Label>
            {roleLocked ? (
              <div className="mt-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-800">
                Superadmin — cannot be changed from the app
              </div>
            ) : (
              <Select
                key={`user-role-${form.role}`}
                value={form.role === 'superadmin' ? 'staff' : form.role}
                onValueChange={(v) => update({ role: v as UserFormData['role'] })}
              >
                <SelectTrigger className="mt-1.5 rounded-xl">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div>
              <Label className="text-slate-700">Active account</Label>
              <p className="text-xs text-slate-500 mt-0.5">Inactive users cannot sign in</p>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v) => update({ isActive: v })} />
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
