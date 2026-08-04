'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Building2, Lock, Globe, Save, Eye, EyeOff, Palette, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const TABS = [
  { id: 'general',  label: 'General',  icon: Building2 },
  { id: 'seo',      label: 'SEO',      icon: Globe },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Theme settings
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // General + SEO settings
  const [settings, setSettings] = useState({
    siteName: '', tagline: '', contactEmail: '', contactPhone: '',
    address: '', linkedIn: '', website: '',
    seoTitle: '', seoDescription: '',
  });

  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data) setSettings((prev) => ({ ...prev, ...data }));
      })
      .finally(() => setLoadingSettings(false));
  }, []);

  const set = (field) => (e) => setSettings((prev) => ({ ...prev, [field]: e.target.value }));
  const setPw = (field) => (e) => setPwForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function saveSettings(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) toast.success('Settings saved');
      else toast.error('Failed to save settings');
    } catch {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Password updated successfully');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSavingPw(false);
    }
  }

  const renderSaveButton = (loading) => (
    <Button type="submit" disabled={loading} className="w-fit">
      <Save className="h-4 w-4" />
      {loading ? 'Saving…' : 'Save Changes'}
    </Button>
  );

  const renderPwInput = ({ field, placeholder, autocomplete }) => (
    <PasswordInput
      name={field === 'new' ? 'newPassword' : field === 'confirm' ? 'confirmPassword' : 'currentPassword'}
      autoComplete={autocomplete}
      value={pwForm[field === 'new' ? 'newPassword' : field === 'confirm' ? 'confirmPassword' : 'currentPassword']}
      onChange={setPw(field === 'new' ? 'newPassword' : field === 'confirm' ? 'confirmPassword' : 'currentPassword')}
      placeholder={placeholder}
      required
    />
  );

  return (
    <>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
        <h1 className="text-xl sm:text-2xl font-headline font-semibold text-text-primary tracking-tight">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">Manage your site configuration and account.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab bar */}
        <div className="mb-6 animate-in fade-in duration-500 delay-100">
          <TabsList>
            {TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

      {loadingSettings ? (
        <div className="text-sm text-text-muted py-8">Loading…</div>
      ) : (
        <div className="animate-in fade-in duration-300">

          {/* ── GENERAL TAB ───────────────────────────────── */}
          <TabsContent value="general">
            <form onSubmit={saveSettings} className="space-y-6 max-w-2xl">
              <section>
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Branding</h2>
                <div className="space-y-4">
                  <FormField label="Site Name">
                    <Input value={settings.siteName} onChange={set('siteName')} placeholder="Smalloys" />
                  </FormField>
                  <FormField label="Tagline" hint="Displayed on the public homepage">
                    <Input value={settings.tagline} onChange={set('tagline')} placeholder="Precision copper casting for demanding industries" />
                  </FormField>
                </div>
              </section>

              <div className="border-t border-border-subtle" />

              <section>
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Contact</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Email">
                    <Input type="email" value={settings.contactEmail} onChange={set('contactEmail')} placeholder="info@smalloys.com" />
                  </FormField>
                  <FormField label="Phone">
                    <Input type="tel" value={settings.contactPhone} onChange={set('contactPhone')} placeholder="+91 00000 00000" />
                  </FormField>
                  <FormField label="Address" className="sm:col-span-2">
                    <Textarea value={settings.address} onChange={set('address')} placeholder="123 Industrial Area, City, State" />
                  </FormField>
                </div>
              </section>

              <div className="border-t border-border-subtle" />

              <section>
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Links</h2>
                <div className="space-y-4">
                  <FormField label="Website URL">
                    <Input type="url" value={settings.website} onChange={set('website')} placeholder="https://smalloys.com" />
                  </FormField>
                  <FormField label="LinkedIn URL">
                    <Input type="url" value={settings.linkedIn} onChange={set('linkedIn')} placeholder="https://linkedin.com/company/smalloys" />
                  </FormField>
                </div>
              </section>

              <div className="pt-2">
                {renderSaveButton(saving)}
              </div>
            </form>
          </TabsContent>

          {/* ── SEO TAB ───────────────────────────────────── */}
          <TabsContent value="seo">
            <form onSubmit={saveSettings} className="space-y-6 max-w-2xl">
              <section>
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Default SEO</h2>
                <p className="text-sm text-text-muted mb-5">
                  These are fallback values used when a page doesn&apos;t have its own SEO fields set.
                </p>
                <div className="space-y-4">
                  <FormField
                    label="Default SEO Title"
                    hint={`${settings.seoTitle.length}/60 characters`}
                  >
                    <Input
                      value={settings.seoTitle}
                      onChange={set('seoTitle')}
                      maxLength={60}
                      placeholder="Smalloys — Precision Copper Castings"
                    />
                  </FormField>
                  <FormField
                    label="Default Meta Description"
                    hint={`${settings.seoDescription.length}/160 characters`}
                  >
                    <Textarea
                      value={settings.seoDescription}
                      onChange={set('seoDescription')}
                      maxLength={160}
                      placeholder="Smalloys manufactures high-quality copper and bronze castings for marine, industrial, and precision engineering applications."
                    />
                  </FormField>
                </div>
              </section>
              <div className="pt-2">
                {renderSaveButton(saving)}
              </div>
            </form>
          </TabsContent>

          {/* ── APPEARANCE TAB ────────────────────────────── */}
          <TabsContent value="appearance">
            <div className="max-w-md">
              <section>
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Theme Preference</h2>
                {mounted && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                        theme === 'light' ? 'border-text-primary bg-surface-muted' : 'border-border-subtle bg-surface hover:border-border-base'
                      }`}
                    >
                      <Sun className={`h-6 w-6 mb-2 ${theme === 'light' ? 'text-text-primary' : 'text-text-muted'}`} />
                      <span className={`text-sm font-medium ${theme === 'light' ? 'text-text-primary' : 'text-text-secondary'}`}>Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                        theme === 'dark' ? 'border-text-primary bg-surface-muted' : 'border-border-subtle bg-surface hover:border-border-base'
                      }`}
                    >
                      <Moon className={`h-6 w-6 mb-2 ${theme === 'dark' ? 'text-text-primary' : 'text-text-muted'}`} />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-text-primary' : 'text-text-secondary'}`}>Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                        theme === 'system' ? 'border-text-primary bg-surface-muted' : 'border-border-subtle bg-surface hover:border-border-base'
                      }`}
                    >
                      <Monitor className={`h-6 w-6 mb-2 ${theme === 'system' ? 'text-text-primary' : 'text-text-muted'}`} />
                      <span className={`text-sm font-medium ${theme === 'system' ? 'text-text-primary' : 'text-text-secondary'}`}>System</span>
                    </button>
                  </div>
                )}
                {!mounted && (
                  <div className="h-[104px] rounded-2xl bg-surface-muted animate-pulse border border-border-subtle"></div>
                )}
              </section>
            </div>
          </TabsContent>

          {/* ── SECURITY TAB ──────────────────────────────── */}
          <TabsContent value="security">
            <div className="max-w-md">
              <section>
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Change Password</h2>
                <form onSubmit={changePassword} className="space-y-4">
                  <FormField label="Current Password">
                    {renderPwInput({ field: 'current', placeholder: 'Enter current password', autocomplete: 'current-password' })}
                  </FormField>
                  <FormField label="New Password" hint="Minimum 8 characters">
                    {renderPwInput({ field: 'new', placeholder: 'Enter new password', autocomplete: 'new-password' })}
                  </FormField>
                  <FormField label="Confirm New Password">
                    {renderPwInput({ field: 'confirm', placeholder: 'Re-enter new password', autocomplete: 'new-password' })}
                  </FormField>
                  <div className="pt-2">
                    <Button type="submit" disabled={savingPw} className="w-fit">
                      <Lock className="h-4 w-4" />
                      {savingPw ? 'Updating…' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </section>

              <div className="mt-8 pt-6 border-t border-border-subtle">
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Session</h2>
                <p className="text-sm text-text-muted mb-4">Sign out of all admin sessions.</p>
                <Button asChild variant="destructive">
                  <a href="/admin/logout">
                    Sign Out
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>

        </div>
      )}
      </Tabs>
    </>
  );
}
