import { useEffect, useMemo, useState } from 'react';
import {
  Save,
  DollarSign,
  Store,
  Image as ImageIcon,
  MapPin,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';
import './BillHeaderSettings.css';

const SAMPLE_ITEMS = [
  { name: 'Chicken Biryani', quantity: 2, unitPrice: 850, total: 1700 },
  { name: 'Chicken Wings', quantity: 1, unitPrice: 790, total: 790 },
  { name: 'Fresh Lime', quantity: 3, unitPrice: 180, total: 540 },
];

function money(amount) {
  return Number(amount || 0).toLocaleString('en-PK');
}

function ShowToggle({ checked, onChange, id }) {
  return (
    <label className="bill-show-toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      Show on bill
    </label>
  );
}

export default function BillHeaderSettings() {
  const { settings, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({
    billWidth: 'short',
    restaurantName: '',
    logo: '',
    address: '',
    phone: '',
    slipFooter: '',
    showNameOnBill: true,
    showLogoOnBill: true,
    showAddressOnBill: true,
    showPhoneOnBill: true,
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      billWidth: settings.billWidth === 'wide' ? 'wide' : 'short',
      restaurantName: settings.restaurantName ?? '',
      logo: settings.logo ?? '',
      address: settings.address ?? '',
      phone: settings.phone ?? '',
      slipFooter: settings.slipFooter ?? '',
      showNameOnBill: settings.showNameOnBill !== false,
      showLogoOnBill: settings.showLogoOnBill !== false,
      showAddressOnBill: settings.showAddressOnBill !== false,
      showPhoneOnBill: settings.showPhoneOnBill !== false,
    });
    setDirty(false);
  }, [settings]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const preview = useMemo(() => {
    const subtotal = SAMPLE_ITEMS.reduce((sum, item) => sum + item.total, 0);
    const discount = 100;
    const total = subtotal - discount;
    return { subtotal, discount, total };
  }, []);

  const handleSave = async () => {
    if (!form.restaurantName.trim()) {
      toast.error('Store name is required');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        billWidth: form.billWidth,
        restaurantName: form.restaurantName.trim(),
        logo: form.logo.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        slipFooter: form.slipFooter.trim(),
        showNameOnBill: form.showNameOnBill,
        showLogoOnBill: form.showLogoOnBill,
        showAddressOnBill: form.showAddressOnBill,
        showPhoneOnBill: form.showPhoneOnBill,
      });
      toast.success('Bill header settings saved');
      setDirty(false);
    } catch (err) {
      toast.error(err.message ?? 'Failed to save bill settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bill-header">
      <div className="bill-header__top">
        <div className="bill-header__title">
          <DollarSign size={22} strokeWidth={1.75} />
          <div>
            <h2>Bill Header Settings</h2>
            <p>Configure how your receipts look, with a live preview.</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="bill-header__grid">
        <div className="panel bill-header__form">
          <div className="form-group">
            <label>Bill width</label>
            <div className="bill-width-options">
              <label className={`bill-width-option ${form.billWidth === 'short' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="billWidth"
                  checked={form.billWidth === 'short'}
                  onChange={() => updateForm('billWidth', 'short')}
                />
                Short (receipt)
              </label>
              <label className={`bill-width-option ${form.billWidth === 'wide' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="billWidth"
                  checked={form.billWidth === 'wide'}
                  onChange={() => updateForm('billWidth', 'wide')}
                />
                Wide (A4 style)
              </label>
            </div>
            <p className="form-hint">
              Short = compact thermal-like bill. Wide = full-width invoice layout.
            </p>
          </div>

          <div className="form-group bill-field-row">
            <div className="bill-field-main">
              <label htmlFor="bill-store-name">
                <Store size={14} /> Store Name
              </label>
              <input
                id="bill-store-name"
                type="text"
                className="form-control"
                value={form.restaurantName}
                onChange={(e) => updateForm('restaurantName', e.target.value)}
              />
            </div>
            <ShowToggle
              id="show-name"
              checked={form.showNameOnBill}
              onChange={(e) => updateForm('showNameOnBill', e.target.checked)}
            />
          </div>

          <div className="form-group bill-field-row">
            <div className="bill-field-main">
              <label>
                <ImageIcon size={14} /> Logo
              </label>
              <div className="bill-logo-box">
                {form.logo ? (
                  <img src={form.logo} alt="" className="bill-logo-preview" />
                ) : (
                  <span>No logo</span>
                )}
              </div>
              <div className="bill-logo-actions">
                <input
                  type="url"
                  className="form-control"
                  value={form.logo}
                  onChange={(e) => updateForm('logo', e.target.value)}
                  placeholder="https://…/logo.png"
                />
              </div>
            </div>
            <ShowToggle
              id="show-logo"
              checked={form.showLogoOnBill}
              onChange={(e) => updateForm('showLogoOnBill', e.target.checked)}
            />
          </div>

          <div className="form-group bill-field-row">
            <div className="bill-field-main">
              <label htmlFor="bill-address">
                <MapPin size={14} /> Address
              </label>
              <textarea
                id="bill-address"
                className="form-control"
                rows={3}
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                placeholder="Address on bill"
              />
            </div>
            <ShowToggle
              id="show-address"
              checked={form.showAddressOnBill}
              onChange={(e) => updateForm('showAddressOnBill', e.target.checked)}
            />
          </div>

          <div className="form-group bill-field-row">
            <div className="bill-field-main">
              <label htmlFor="bill-phone">
                <Phone size={14} /> Phone
              </label>
              <input
                id="bill-phone"
                type="tel"
                className="form-control"
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
              />
            </div>
            <ShowToggle
              id="show-phone"
              checked={form.showPhoneOnBill}
              onChange={(e) => updateForm('showPhoneOnBill', e.target.checked)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bill-footer">Footer message</label>
            <input
              id="bill-footer"
              type="text"
              className="form-control"
              value={form.slipFooter}
              onChange={(e) => updateForm('slipFooter', e.target.value)}
              placeholder="Thank you for dining with us"
            />
          </div>
        </div>

        <div className="panel bill-header__preview-wrap">
          <h3>Live Bill Preview</h3>
          <div
            className={`bill-preview ${form.billWidth === 'wide' ? 'bill-preview--wide' : 'bill-preview--short'}`}
          >
            <div className="bill-preview__paper">
              {form.showLogoOnBill && form.logo ? (
                <img src={form.logo} alt="" className="bill-preview__logo" />
              ) : null}
              {form.showNameOnBill ? (
                <p className="bill-preview__name">{form.restaurantName || 'Your Kitchen'}</p>
              ) : null}
              {form.showPhoneOnBill && form.phone ? (
                <p className="bill-preview__meta">{form.phone}</p>
              ) : null}
              {form.showAddressOnBill && form.address ? (
                <p className="bill-preview__meta">{form.address}</p>
              ) : null}

              <hr className="bill-preview__rule" />
              <div className="bill-preview__row">
                <span>Bill No:</span>
                <strong>BILL-20250001</strong>
              </div>
              <div className="bill-preview__row">
                <span>Date:</span>
                <strong>{new Date().toLocaleString('en-GB')}</strong>
              </div>
              <div className="bill-preview__row">
                <span>Cashier:</span>
                <strong>Admin</strong>
              </div>

              <hr className="bill-preview__rule" />
              <div className="bill-preview__items-head">
                <span>Item</span>
                <span>Qty</span>
                <span>Rate</span>
                <span>Amount</span>
              </div>
              {SAMPLE_ITEMS.map((item) => (
                <div key={item.name} className="bill-preview__item">
                  <span className="bill-preview__item-name">{item.name}</span>
                  <span>{item.quantity}</span>
                  <span>{money(item.unitPrice)}</span>
                  <span>{money(item.total)}</span>
                </div>
              ))}

              <hr className="bill-preview__rule" />
              <div className="bill-preview__row">
                <span>Subtotal</span>
                <strong>{money(preview.subtotal)}</strong>
              </div>
              <div className="bill-preview__row">
                <span>Discount</span>
                <strong>{money(preview.discount)}</strong>
              </div>
              <div className="bill-preview__row bill-preview__row--total">
                <span>TOTAL</span>
                <strong>{money(preview.total)}</strong>
              </div>

              <hr className="bill-preview__rule" />
              <div className="bill-preview__row">
                <span>Payment Method</span>
                <strong>Cash</strong>
              </div>
              <div className="bill-preview__row">
                <span>Amount Paid</span>
                <strong>{money(preview.total)}</strong>
              </div>
              <div className="bill-preview__row">
                <span>Status</span>
                <strong>Fully Paid</strong>
              </div>

              {form.slipFooter ? (
                <>
                  <hr className="bill-preview__rule" />
                  <p className="bill-preview__footer">{form.slipFooter}</p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
