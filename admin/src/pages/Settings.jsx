import { useEffect, useState } from 'react';
import {
  Save,
  Store,
  Percent,
  Receipt,
  Megaphone,
  Palette,
  Code,
  Globe,
  Phone,
  Mail,
  MapPin,
  Image,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useSettings } from '../context/SettingsContext';
import './Settings.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const EMPTY_FORM = {
  restaurantName: '',
  phone: '',
  email: '',
  address: '',
  logo: '',
  taxPercent: 0,
  serviceChargePercent: 0,
  slipFooter: '',
  autoSlipWalkIn: true,
  autoSlipOnlineAccept: false,
  isOpen: true,
  announcement: '',
};

export default function Settings() {
  const { settings, loading, updateSettings } = useSettings();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        restaurantName: settings.restaurantName ?? '',
        phone: settings.phone ?? '',
        email: settings.email ?? '',
        address: settings.address ?? '',
        logo: settings.logo ?? '',
        taxPercent: settings.taxPercent ?? 0,
        serviceChargePercent: settings.serviceChargePercent ?? 0,
        slipFooter: settings.slipFooter ?? '',
        autoSlipWalkIn: settings.autoSlipWalkIn ?? true,
        autoSlipOnlineAccept: settings.autoSlipOnlineAccept ?? false,
        isOpen: settings.isOpen ?? true,
        announcement: settings.announcement ?? '',
      });
      setDirty(false);
    }
  }, [settings]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form.restaurantName.trim()) {
      toast.error('Restaurant name is required');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        restaurantName: form.restaurantName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        logo: form.logo.trim(),
        taxPercent: Number(form.taxPercent) || 0,
        serviceChargePercent: Number(form.serviceChargePercent) || 0,
        slipFooter: form.slipFooter.trim(),
        autoSlipWalkIn: form.autoSlipWalkIn,
        autoSlipOnlineAccept: form.autoSlipOnlineAccept,
        isOpen: form.isOpen,
        announcement: form.announcement.trim(),
      });
      toast.success('Settings saved successfully');
      setDirty(false);
    } catch (err) {
      toast.error(err.message ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="page settings-page">
        <div className="settings-loading">
          <LoadingSpinner size={48} label="Loading settings" />
          <p>Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Restaurant profile, billing, slips, and preferences</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          <Save size={18} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="settings-grid animate-slide-up">
        <section className="panel settings-section">
          <div className="settings-section-head">
            <Store size={20} />
            <h2 className="settings-section-title">Restaurant Profile</h2>
          </div>

          <div className="form-group">
            <label htmlFor="settings-name">Restaurant Name *</label>
            <input
              id="settings-name"
              type="text"
              className="form-control"
              value={form.restaurantName}
              onChange={(e) => updateForm('restaurantName', e.target.value)}
              placeholder="Your Kitchen"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="settings-phone">
                <Phone size={14} /> Phone
              </label>
              <input
                id="settings-phone"
                type="tel"
                className="form-control"
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                placeholder="+92 21 34567890"
              />
            </div>
            <div className="form-group">
              <label htmlFor="settings-email">
                <Mail size={14} /> Email
              </label>
              <input
                id="settings-email"
                type="email"
                className="form-control"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                placeholder="hello@yourkitchen.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="settings-address">
              <MapPin size={14} /> Address
            </label>
            <textarea
              id="settings-address"
              className="form-control"
              value={form.address}
              onChange={(e) => updateForm('address', e.target.value)}
              placeholder="Full restaurant address"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="settings-logo">
              <Image size={14} /> Logo URL
            </label>
            <input
              id="settings-logo"
              type="url"
              className="form-control"
              value={form.logo}
              onChange={(e) => updateForm('logo', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            {form.logo && (
              <div className="settings-logo-preview">
                <img src={form.logo} alt="Logo preview" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Currency</label>
            <div className="settings-readonly">
              <Globe size={16} />
              <span>PKR — Pakistani Rupee</span>
              <span className="settings-readonly-badge">Fixed</span>
            </div>
            <p className="form-hint">All prices and reports display in PKR</p>
          </div>
        </section>

        <section className="panel settings-section">
          <div className="settings-section-head">
            <Percent size={20} />
            <h2 className="settings-section-title">Tax & Service Charge</h2>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="settings-tax">Tax (%)</label>
              <input
                id="settings-tax"
                type="number"
                className="form-control"
                value={form.taxPercent}
                min={0}
                max={100}
                step={0.5}
                onChange={(e) => updateForm('taxPercent', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="settings-service">Service Charge (%)</label>
              <input
                id="settings-service"
                type="number"
                className="form-control"
                value={form.serviceChargePercent}
                min={0}
                max={100}
                step={0.5}
                onChange={(e) => updateForm('serviceChargePercent', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="settings-slip-footer">
              <Receipt size={14} /> Slip Footer Text
            </label>
            <textarea
              id="settings-slip-footer"
              className="form-control"
              value={form.slipFooter}
              onChange={(e) => updateForm('slipFooter', e.target.value)}
              placeholder="Thank you for dining with us!"
              rows={3}
            />
          </div>

          <div className="settings-toggles">
            <div className="toggle-row settings-toggle-row">
              <div>
                <strong>Auto-generate slip on walk-in</strong>
                <p className="form-hint">Print receipt when POS order is placed</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.autoSlipWalkIn}
                  onChange={(e) => updateForm('autoSlipWalkIn', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="toggle-row settings-toggle-row">
              <div>
                <strong>Auto-generate slip on online accept</strong>
                <p className="form-hint">Print kitchen slip when online order is accepted</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.autoSlipOnlineAccept}
                  onChange={(e) => updateForm('autoSlipOnlineAccept', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </section>

        <section className="panel settings-section">
          <div className="settings-section-head">
            <Megaphone size={20} />
            <h2 className="settings-section-title">Operations</h2>
          </div>

          <div className="toggle-row settings-toggle-row settings-open-toggle">
            <div>
              <strong>Restaurant Open</strong>
              <p className="form-hint">
                {form.isOpen
                  ? 'Accepting orders from all channels'
                  : 'Closed — online ordering paused'}
              </p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.isOpen}
                onChange={(e) => updateForm('isOpen', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className={`settings-open-status ${form.isOpen ? 'settings-open-status--open' : 'settings-open-status--closed'}`}>
            {form.isOpen ? '● Open for business' : '● Currently closed'}
          </div>

          <div className="form-group">
            <label htmlFor="settings-announcement">Announcement Banner</label>
            <textarea
              id="settings-announcement"
              className="form-control"
              value={form.announcement}
              onChange={(e) => updateForm('announcement', e.target.value)}
              placeholder="Promotional message shown to customers"
              rows={2}
            />
            <p className="form-hint">Displayed on customer-facing channels when set</p>
          </div>
        </section>

        <section className="panel settings-section settings-section--info">
          <div className="settings-section-head">
            <Palette size={20} />
            <h2 className="settings-section-title">Appearance & Developer</h2>
          </div>

          <div className="settings-info-block">
            <strong>Theme</strong>
            <p>
              Light and dark mode can be toggled from the top bar (sun/moon icon).
              Theme preference is saved locally in your browser.
            </p>
          </div>

          <div className="settings-info-block settings-api-block">
            <div className="settings-api-label">
              <Code size={16} />
              <strong>API Base URL</strong>
            </div>
            <code className="settings-api-url">{API_BASE_URL}</code>
            <p className="form-hint">
              Set via <code>VITE_API_BASE_URL</code> in your <code>.env</code> file.
              Mock data is used when the API is unavailable or <code>VITE_USE_MOCK=true</code>.
            </p>
          </div>
        </section>
      </div>

      <div className="settings-footer-actions animate-slide-up">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          <Save size={18} />
          {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
}
