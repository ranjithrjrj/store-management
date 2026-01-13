// FILE PATH: components/Settings.tsx
// Store settings management with new UI components

'use client';
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Building2, Palette, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { Button, Card, Input, LoadingSpinner, useToast, Badge } from '@/components/ui';
import { getThemeNames, ThemeName } from '@/lib/themes';

type StoreSettings = {
  id?: string;
  store_name: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  state_code?: string;
  pincode?: string;
  phone?: string;
  email?: string;
};

const Settings = () => {
  const { theme, themeName, setTheme } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);

  const [formData, setFormData] = useState<StoreSettings>({
    store_name: '',
    gstin: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    state_code: '33',
    pincode: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1);

      if (err) throw err;

      if (data && data.length > 0) {
        const settings = data[0];
        setFormData({
          id: settings.id,
          store_name: settings.store_name || '',
          gstin: settings.gstin || '',
          address: settings.address || '',
          city: settings.city || '',
          state: settings.state || 'Tamil Nadu',
          state_code: settings.state_code || '33',
          pincode: settings.pincode || '',
          phone: settings.phone || '',
          email: settings.email || ''
        });
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message || 'Failed to load settings');
      toast.error('Failed to load', 'Could not load store settings.');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.store_name.trim()) {
        toast.warning('Store name required', 'Please enter a store name.');
        return;
      }

      const settingsData = {
        store_name: formData.store_name,
        gstin: formData.gstin || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        state_code: formData.state_code || null,
        pincode: formData.pincode || null,
        phone: formData.phone || null,
        email: formData.email || null
      };

      if (formData.id) {
        const { error: err } = await supabase
          .from('store_settings')
          .update(settingsData)
          .eq('id', formData.id);

        if (err) throw err;
      } else {
        const { data: newSettings, error: err } = await supabase
          .from('store_settings')
          .insert(settingsData)
          .select()
          .single();

        if (err) throw err;
        setFormData({ ...formData, id: newSettings.id });
      }

      toast.success('Settings saved!', 'Your store settings have been updated.');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save', err.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: ThemeName) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
    toast.success('Theme changed', `Switched to ${newTheme} theme.`);
  };

  const availableThemes = getThemeNames();
  const themeColors: Record<ThemeName, string> = {
    emerald: '#10b981',
    blue: '#3b82f6',
    purple: '#a855f7',
    teal: '#14b8a6',
    slate: '#64748b'
  };

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Store Settings</h2>
          <p className="text-gray-600 text-sm mt-1">Configure your store information</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <SettingsIcon size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="font-bold text-red-800 mb-2">Failed to Load Settings</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadSettings} variant="primary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Store Settings</h2>
          <p className="text-gray-600 text-sm mt-1">Configure your store information and preferences</p>
        </div>
        <Button onClick={handleSave} variant="primary" size="md" icon={<Save size={18} />} loading={saving}>
          Save Settings
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading settings..." />
          </div>
        </Card>
      ) : (
        <>
          {/* Theme Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
                <Palette size={24} className={theme.classes.textPrimary} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Theme</h3>
                <p className="text-sm text-gray-600">Choose your preferred color theme</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {availableThemes.map((themeObj) => (
                <button
                  key={themeObj.name}
                  onClick={() => handleThemeChange(themeObj.name)}
                  className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedTheme === themeObj.name
                      ? 'border-current shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    borderColor: selectedTheme === themeObj.name ? themeColors[themeObj.name] : undefined
                  }}
                >
                  <div
                    className="w-full h-12 rounded-md mb-2"
                    style={{ backgroundColor: themeColors[themeObj.name] }}
                  />
                  <p className="text-sm font-medium text-gray-900 capitalize">{themeObj.displayName}</p>
                  {selectedTheme === themeObj.name && (
                    <div className="absolute -top-2 -right-2">
                      <Badge variant="success" size="sm">Active</Badge>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Store Information */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
                <Building2 size={24} className={theme.classes.textPrimary} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Store Information</h3>
                <p className="text-sm text-gray-600">Basic details about your store</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Store Name"
                placeholder="Enter store name"
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                required
                leftIcon={<Building2 size={18} />}
              />

              <Input
                label="GSTIN"
                placeholder="Enter GSTIN (15 characters)"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                helperText="15-character GST Identification Number"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  leftIcon={<Phone size={18} />}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  leftIcon={<Mail size={18} />}
                />
              </div>
            </div>
          </Card>

          {/* Address Information */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 ${theme.classes.bgPrimaryLight} rounded-lg`}>
                <MapPin size={24} className={theme.classes.textPrimary} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                <p className="text-sm text-gray-600">Store location details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 transition-all`}
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />

                <Input
                  label="State"
                  placeholder="Enter state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />

                <Input
                  label="State Code"
                  placeholder="e.g., 33"
                  value={formData.state_code}
                  onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                  helperText="2-digit GST state code"
                />

                <Input
                  label="Pincode"
                  placeholder="Enter pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Settings;