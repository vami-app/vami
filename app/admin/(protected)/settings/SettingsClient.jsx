'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Building2, Lock, Globe, Save, Eye, EyeOff } from 'lucide-react';

const TABS = [
  { id: 'general',  label: 'General',  icon: Building2 },
  { id: 'seo',      label: 'SEO',      icon: Globe },
  { id: 'security', label: 'Security', icon: Lock },
];

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="block w-full py-2.5 px-3.5 bg-[#f9f9f9] border border-black/10 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
  />
);

const Textarea = (props) => (
  <textarea
    rows={3}
    {...props}
    className="block w-full py-2.5 px-3.5 bg-[#f9f9f9] border border-black/10 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all resize-none"
  />
);

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

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

  const SaveButton = ({ loading }) => (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Save className="h-4 w-4" />
      {loading ? 'Saving…' : 'Save Changes'}
    </button>
  );

  const PwInput = ({ field, placeholder, autocomplete }) => (
    <div className="relative">
      <Input
        type={showPw[field] ? 'text' : 'password'}
        name={field === 'new' ? 'newPassword' : field === 'confirm' ? 'confirmPassword' : 'currentPassword'}
        autoComplete={autocomplete}
        value={pwForm[field === 'new' ? 'newPassword' : field === 'confirm' ? 'confirmPassword' : 'currentPassword']}
        onChange={setPw(field === 'new' ? 'newPassword' : field === 'confirm' ? 'confirmPassword' : 'currentPassword')}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {showPw[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
        <h1 className="text-xl sm:text-2xl font-headline font-semibold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your site configuration and account.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-[#f9f9f9] rounded-2xl p-1 w-fit animate-in fade-in duration-500 delay-100">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm border border-black/5'
                : 'text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {loadingSettings ? (
        <div className="text-sm text-gray-400 py-8">Loading…</div>
      ) : (
        <div className="animate-in fade-in duration-300">

          {/* ── GENERAL TAB ───────────────────────────────── */}
          {activeTab === 'general' && (
            <form onSubmit={saveSettings} className="space-y-6 max-w-2xl">
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Branding</h2>
                <div className="space-y-4">
                  <Field label="Site Name">
                    <Input value={settings.siteName} onChange={set('siteName')} placeholder="Smalloys" />
                  </Field>
                  <Field label="Tagline" hint="Displayed on the public homepage">
                    <Input value={settings.tagline} onChange={set('tagline')} placeholder="Precision copper casting for demanding industries" />
                  </Field>
                </div>
              </section>

              <div className="border-t border-black/5" />

              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Contact</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Email">
                    <Input type="email" value={settings.contactEmail} onChange={set('contactEmail')} placeholder="info@smalloys.com" />
                  </Field>
                  <Field label="Phone">
                    <Input type="tel" value={settings.contactPhone} onChange={set('contactPhone')} placeholder="+91 00000 00000" />
                  </Field>
                  <Field label="Address" >
                    <div className="sm:col-span-2">
                      <Textarea value={settings.address} onChange={set('address')} placeholder="123 Industrial Area, City, State" />
                    </div>
                  </Field>
                </div>
              </section>

              <div className="border-t border-black/5" />

              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Links</h2>
                <div className="space-y-4">
                  <Field label="Website URL">
                    <Input type="url" value={settings.website} onChange={set('website')} placeholder="https://smalloys.com" />
                  </Field>
                  <Field label="LinkedIn URL">
                    <Input type="url" value={settings.linkedIn} onChange={set('linkedIn')} placeholder="https://linkedin.com/company/smalloys" />
                  </Field>
                </div>
              </section>

              <div className="pt-2">
                <SaveButton loading={saving} />
              </div>
            </form>
          )}

          {/* ── SEO TAB ───────────────────────────────────── */}
          {activeTab === 'seo' && (
            <form onSubmit={saveSettings} className="space-y-6 max-w-2xl">
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Default SEO</h2>
                <p className="text-sm text-gray-500 mb-5">
                  These are fallback values used when a page doesn&apos;t have its own SEO fields set.
                </p>
                <div className="space-y-4">
                  <Field
                    label="Default SEO Title"
                    hint={`${settings.seoTitle.length}/60 characters`}
                  >
                    <Input
                      value={settings.seoTitle}
                      onChange={set('seoTitle')}
                      maxLength={60}
                      placeholder="Smalloys — Precision Copper Castings"
                    />
                  </Field>
                  <Field
                    label="Default Meta Description"
                    hint={`${settings.seoDescription.length}/160 characters`}
                  >
                    <Textarea
                      value={settings.seoDescription}
                      onChange={set('seoDescription')}
                      maxLength={160}
                      placeholder="Smalloys manufactures high-quality copper and bronze castings for marine, industrial, and precision engineering applications."
                    />
                  </Field>
                </div>
              </section>
              <div className="pt-2">
                <SaveButton loading={saving} />
              </div>
            </form>
          )}

          {/* ── SECURITY TAB ──────────────────────────────── */}
          {activeTab === 'security' && (
            <div className="max-w-md">
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Change Password</h2>
                <form onSubmit={changePassword} className="space-y-4">
                  <Field label="Current Password">
                    <PwInput field="current" placeholder="Enter current password" autocomplete="current-password" />
                  </Field>
                  <Field label="New Password" hint="Minimum 8 characters">
                    <PwInput field="new" placeholder="Enter new password" autocomplete="new-password" />
                  </Field>
                  <Field label="Confirm New Password">
                    <PwInput field="confirm" placeholder="Re-enter new password" autocomplete="new-password" />
                  </Field>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingPw}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Lock className="h-4 w-4" />
                      {savingPw ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </section>

              <div className="mt-8 pt-6 border-t border-black/5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Session</h2>
                <p className="text-sm text-gray-500 mb-4">Sign out of all admin sessions.</p>
                <a
                  href="/admin/logout"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/10 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </a>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}
