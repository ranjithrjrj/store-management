// FILE PATH: components/Settings.tsx
// Store settings management with database integration

'use client';
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Building2, Palette } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui';
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
  const { themeName, setTheme } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  // Test function to diagnose database connection
  const testDatabaseConnection = async () => {
    console.log('=== MANUAL DATABASE TEST ===');
    
    try {
      // Test 1: Simple query
      console.log('Test 1: Simple SELECT *');
      const { data: allData, error: allError } = await supabase
        .from('store_settings')
        .select('*');
      
      console.log('Raw response:', { data: allData, error: allError });
      
      if (allError) {
        alert('❌ Database Error: ' + allError.message);
        return;
      }
      
      if (!allData || allData.length === 0) {
        alert('❌ No data in table! Please insert data in Supabase.');
        return;
      }
      
      alert(`✅ SUCCESS! Found ${allData.length} row(s). Check console for full data.`);
      console.log('All rows:', allData);
      console.table(allData[0]);
      
    } catch (err: any) {
      console.error('Test error:', err);
      alert('❌ Test failed: ' + err.message);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading settings from database...');
      
      const { data, error: err } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1);

      console.log('Supabase response:', { data, error: err });

      if (err) {
        console.error('Database error:', err);
        throw err;
      }

      if (data && data.length > 0) {
        const settings = data[0];
        console.log('Loaded settings:', settings);
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
      } else {
        console.log('No settings found in database - empty result');
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (!formData.store_name.trim()) {
        toast.warning('Store name required', 'Please enter a store name before saving.');
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
        // Update existing settings
        console.log('Updating settings with ID:', formData.id);
        const { data, error: err } = await supabase
          .from('store_settings')
          .update(settingsData)
          .eq('id', formData.id)
          .select();

        if (err) {
          console.error('Update error:', err);
          throw err;
        }
        console.log('Update successful:', data);
      } else {
        // Insert new settings
        console.log('Inserting new settings');
        const { data, error: err } = await supabase
          .from('store_settings')
          .insert(settingsData)
          .select()
          .single();

        if (err) {
          console.error('Insert error:', err);
          throw err;
        }
        console.log('Insert successful:', data);
        if (data) {
          setFormData({ ...formData, id: data.id });
        }
      }

      toast.success('Settings saved!', 'Your store settings have been updated successfully.');
      
      // Update theme if changed
      if (selectedTheme !== themeName) {
        await setTheme(selectedTheme);
        toast.info('Theme updated', `Switched to ${getThemeNames().find(t => t.name === selectedTheme)?.displayName}`);
      }
      
      // Reload settings to confirm save
      await loadSettings();
      
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
      toast.error('Failed to save', err.message || 'Could not save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Store Settings</h2>
          <p className="text-gray-600 text-sm mt-1">Configure your store information</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-800 mb-2">Failed to Load Settings</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadSettings}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Store Settings</h2>
          <p className="text-gray-600 text-sm mt-1">Configure your store information</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={testDatabaseConnection}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm font-medium"
          >
            🔍 Test DB Connection
          </button>
          <SettingsIcon size={24} className="text-gray-400" />
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Debug Info */}
      {formData.id && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <strong>Settings ID:</strong> {formData.id}
            <span className="ml-4">
              <strong>Last Updated:</strong> {new Date().toLocaleString('en-IN')}
            </span>
          </p>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Store Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Store Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Thirukumaran Angadi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="15 characters"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10 digits"
                    maxLength={10}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="store@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Mettupalayam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Tamil Nadu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                  <input
                    type="text"
                    value={formData.state_code}
                    onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 33"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="6 digits"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Palette size={20} className="text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Color Theme</h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Choose a color scheme for your application. The theme will apply to buttons, badges, and accents throughout the interface.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getThemeNames().map((theme) => (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => setSelectedTheme(theme.name)}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      selectedTheme === theme.name
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{theme.displayName}</h4>
                      {selectedTheme === theme.name && (
                        <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{theme.description}</p>
                    {/* Color preview dots */}
                    <div className="flex gap-2">
                      {theme.name === 'emerald' && (
                        <>
                          <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow"></div>
                          <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow"></div>
                        </>
                      )}
                      {theme.name === 'blue' && (
                        <>
                          <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                          <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white shadow"></div>
                        </>
                      )}
                      {theme.name === 'purple' && (
                        <>
                          <div className="w-6 h-6 rounded-full bg-purple-600 border-2 border-white shadow"></div>
                          <div className="w-6 h-6 rounded-full bg-pink-500 border-2 border-white shadow"></div>
                        </>
                      )}
                      {theme.name === 'teal' && (
                        <>
                          <div className="w-6 h-6 rounded-full bg-teal-600 border-2 border-white shadow"></div>
                          <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow"></div>
                        </>
                      )}
                      {theme.name === 'slate' && (
                        <>
                          <div className="w-6 h-6 rounded-full bg-sky-600 border-2 border-white shadow"></div>
                          <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow"></div>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !formData.store_name.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> These settings will be used in invoices, reports, and other documents. 
                Make sure all information is accurate, especially the GSTIN for tax compliance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;