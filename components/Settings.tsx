// FILE PATH: components/Settings.tsx
// Beautiful Modern Settings - Teal & Gold Theme with Enhanced UI

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Save, Building2, Palette, Mail, 
  Phone, MapPin, FileText, CheckCircle, ChevronDown, X 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { Button, Badge, LoadingSpinner, useToast } from '@/components/ui';
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
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

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
      toast.error('Failed to load', 'Could not load store settings.');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true);

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
    setShowThemeDropdown(false);
    toast.success('Theme changed!', `Switched to ${newTheme} theme.`);
  };

  const availableThemes = getThemeNames();
  const themeColors: Record<ThemeName, { primary: string; secondary: string; name: string }> = {
    emerald: { primary: '#10b981', secondary: '#34d399', name: 'Emerald' },
    blue: { primary: '#3b82f6', secondary: '#60a5fa', name: 'Blue' },
    purple: { primary: '#a855f7', secondary: '#c084fc', name: 'Purple' },
    teal: { primary: '#14b8a6', secondary: '#2dd4bf', name: 'Teal' },
    slate: { primary: '#64748b', secondary: '#94a3b8', name: 'Slate' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-slate-700 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
                <SettingsIcon className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-600 mt-1">Configure your store information & preferences</p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              variant="primary" 
              size="md" 
              icon={<Save size={18} />}
              disabled={saving}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* Theme Settings with Dropdown */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Palette className="text-white" size={24} />
              <div>
                <h3 className="text-xl font-bold text-white">Appearance</h3>
                <p className="text-sm text-purple-100">Customize your interface theme</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Theme Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl hover:border-teal-500 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg shadow-md"
                    style={{ 
                      background: `linear-gradient(135deg, ${themeColors[selectedTheme].primary}, ${themeColors[selectedTheme].secondary})`
                    }}
                  />
                  <div className="text-left">
                    <p className="text-sm text-slate-600 font-medium">Current Theme</p>
                    <p className="text-lg font-bold text-slate-900">{themeColors[selectedTheme].name}</p>
                  </div>
                </div>
                <ChevronDown 
                  size={24} 
                  className={`text-slate-600 transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded Theme Options */}
              {showThemeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-slate-200 z-50 overflow-hidden">
                  <div className="p-4 space-y-2">
                    {availableThemes.map((themeObj) => (
                      <button
                        key={themeObj.name}
                        onClick={() => handleThemeChange(themeObj.name)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                          selectedTheme === themeObj.name
                            ? 'border-current shadow-lg bg-gradient-to-r from-slate-50 to-slate-100'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        style={{
                          borderColor: selectedTheme === themeObj.name ? themeColors[themeObj.name].primary : undefined
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-16 h-16 rounded-lg shadow-md"
                            style={{ 
                              background: `linear-gradient(135deg, ${themeColors[themeObj.name].primary}, ${themeColors[themeObj.name].secondary})`
                            }}
                          />
                          <div className="text-left">
                            <p className="text-lg font-bold text-slate-900">{themeColors[themeObj.name].name}</p>
                            <p className="text-sm text-slate-600">
                              {themeObj.name === 'emerald' && 'Fresh & vibrant green theme'}
                              {themeObj.name === 'blue' && 'Classic & professional blue theme'}
                              {themeObj.name === 'purple' && 'Creative & modern purple theme'}
                              {themeObj.name === 'teal' && 'Balanced & sophisticated theme'}
                              {themeObj.name === 'slate' && 'Minimal & elegant grey theme'}
                            </p>
                          </div>
                        </div>
                        {selectedTheme === themeObj.name && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-sm font-semibold text-green-700">Active</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="mt-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-3">Theme Preview:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 text-center">
                  <div 
                    className="w-full h-8 rounded mb-2"
                    style={{ backgroundColor: themeColors[selectedTheme].primary }}
                  />
                  <p className="text-xs text-slate-600">Primary</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 text-center">
                  <div 
                    className="w-full h-8 rounded mb-2"
                    style={{ backgroundColor: themeColors[selectedTheme].secondary }}
                  />
                  <p className="text-xs text-slate-600">Secondary</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 text-center">
                  <div 
                    className="w-full h-8 rounded mb-2"
                    style={{ 
                      background: `linear-gradient(135deg, ${themeColors[selectedTheme].primary}, ${themeColors[selectedTheme].secondary})`
                    }}
                  />
                  <p className="text-xs text-slate-600">Gradient</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 text-center">
                  <div className="flex items-center justify-center h-8">
                    <Badge variant="primary">Sample</Badge>
                  </div>
                  <p className="text-xs text-slate-600">Components</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <Building2 className="text-white" size={24} />
              <div>
                <h3 className="text-xl font-bold text-white">Store Information</h3>
                <p className="text-sm text-teal-100">Basic details about your business</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Store Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  placeholder="Enter your store name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                GSTIN <span className="text-slate-400">(Optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  placeholder="15-character GSTIN"
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">GST Identification Number (15 characters)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                    placeholder="Store phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                    placeholder="Store email address"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <MapPin className="text-white" size={24} />
              <div>
                <h3 className="text-xl font-bold text-white">Location Details</h3>
                <p className="text-sm text-blue-100">Store address information</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Street Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                placeholder="Enter complete street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  placeholder="City name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  placeholder="State name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">State Code</label>
                <input
                  type="text"
                  value={formData.state_code}
                  onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  placeholder="e.g., 33"
                  maxLength={2}
                />
                <p className="text-xs text-slate-500 mt-1">2-digit GST state code</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button (Mobile Sticky) */}
        <div className="sticky bottom-4 flex justify-center md:hidden">
          <Button 
            onClick={handleSave} 
            variant="primary" 
            size="md" 
            icon={<Save size={18} />}
            disabled={saving}
            className="bg-gradient-to-r from-teal-600 to-teal-700 shadow-2xl"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Footer Note */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <CheckCircle size={16} className="text-green-600" />
            <span>Settings are saved automatically to your database</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
