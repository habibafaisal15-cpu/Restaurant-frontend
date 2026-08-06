import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Printer,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PosItemGrid from '../components/pos/PosItemGrid';
import Modal from '../components/ui/Modal';
import SlipPreview from '../components/slips/SlipPreview';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import * as menuService from '../services/menuService';
import * as categoryService from '../services/categoryService';
import * as orderService from '../services/orderService';
import * as slipService from '../services/slipService';
import { formatPKR } from '../utils/format';
import './POS.css';

const ORDER_TYPES = [
  { key: 'DINE_IN', label: 'Dine-in', icon: UtensilsCrossed },
  { key: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingBag },
];

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'card', label: 'Card', icon: CreditCard },
  { key: 'online', label: 'Online transfer', icon: Smartphone },
];

function settingsForSlip(settings) {
  return {
    name: settings.restaurantName,
    logo: settings.logo,
    address: settings.address,
    phone: settings.phone,
    footer: settings.slipFooter,
    taxRate: settings.taxPercent,
  };
}

function calcCartTotals(cart, settings) {
  const subtotal = cart.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const taxPercent = settings.taxPercent ?? 0;
  const servicePercent = settings.serviceChargePercent ?? 0;
  const tax = Math.round(subtotal * (taxPercent / 100));
  const serviceCharge = Math.round(subtotal * (servicePercent / 100));
  const total = subtotal + tax + serviceCharge;
  return { subtotal, tax, serviceCharge, total };
}

function cartLineKey(menuItemId, notes) {
  return `${menuItemId}::${notes ?? ''}`;
}

export default function POS() {
  const { settings } = useSettings();
  const { user } = useAuth();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [orderType, setOrderType] = useState('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cart, setCart] = useState([]);

  const [placing, setPlacing] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [slipOpen, setSlipOpen] = useState(false);

  const loadMenu = useCallback(async () => {
    setLoadingMenu(true);
    try {
      const [items, cats] = await Promise.all([
        menuService.getAll({ available: true }),
        categoryService.getAll(),
      ]);
      setMenuItems(items);
      setCategories(cats.filter((c) => c.active));
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const totals = useMemo(
    () => calcCartTotals(cart, settings),
    [cart, settings],
  );

  const handleAddItem = (item) => {
    const unitPrice = item.discountPrice ?? item.price ?? 0;
    setCart((prev) => {
      const key = cartLineKey(item.id, '');
      const existing = prev.find(
        (l) => cartLineKey(l.menuItemId, l.notes) === key,
      );
      if (existing) {
        return prev.map((l) =>
          cartLineKey(l.menuItemId, l.notes) === key
            ? { ...l, quantity: l.quantity + 1 }
            : l,
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice,
          quantity: 1,
          notes: '',
        },
      ];
    });
  };

  const updateQty = (lineKey, delta) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (cartLineKey(l.menuItemId, l.notes) !== lineKey) return l;
          return { ...l, quantity: l.quantity + delta };
        })
        .filter((l) => l.quantity > 0),
    );
  };

  const updateNotes = (lineKey, notes) => {
    setCart((prev) =>
      prev.map((l) =>
        cartLineKey(l.menuItemId, l.notes) === lineKey ? { ...l, notes } : l,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
    setTableNumber('');
    setCustomerName('');
    setCustomerPhone('');
  };

  const resetForNewOrder = () => {
    setSuccessOrder(null);
    setSlipOpen(false);
    clearCart();
    setPaymentMethod('cash');
    setOrderType('DINE_IN');
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Add items to the cart first');
      return;
    }

    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      toast.error('Table number is required for dine-in orders');
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        type: orderType,
        items: cart.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          notes: l.notes,
        })),
        customer: {
          name: customerName.trim() || 'Walk-in Guest',
          phone: customerPhone.trim(),
        },
        tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : undefined,
        paymentMethod,
        paymentStatus: 'paid',
        cashierName: user?.name ?? 'Cashier',
      };

      const order = await orderService.createWalkIn(payload);

      let slipOrder = order;
      if (!order.slip) {
        try {
          await slipService.generate(order.id, 'kitchen');
          slipOrder = await orderService.getById(order.id);
        } catch {
          /* slip optional */
        }
      }

      setSuccessOrder(slipOrder);
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err.message ?? 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loadingMenu) {
    return (
      <div className="page pos-page pos-page--loading">
        <LoadingSpinner size={48} label="Loading menu…" />
      </div>
    );
  }

  if (successOrder) {
    return (
      <div className="page pos-page pos-success animate-scale-in">
        <div className="pos-success-card panel">
          <div className="pos-success-icon">
            <CheckCircle2 size={56} />
          </div>
          <h1>Order Placed!</h1>
          <p className="pos-success-sub">Your walk-in order has been sent to the kitchen.</p>

          <div className="pos-success-details">
            <div className="pos-success-row">
              <span>Order ID</span>
              <strong>{successOrder.orderNumber}</strong>
            </div>
            {successOrder.tokenNumber && (
              <div className="pos-success-row pos-success-token">
                <span>Token</span>
                <strong>{successOrder.tokenNumber}</strong>
              </div>
            )}
            {successOrder.tableNumber && (
              <div className="pos-success-row">
                <span>Table</span>
                <strong>{successOrder.tableNumber}</strong>
              </div>
            )}
            <div className="pos-success-row">
              <span>Total</span>
              <strong>{formatPKR(successOrder.total)}</strong>
            </div>
          </div>

          <div className="pos-success-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setSlipOpen(true)}>
              <Printer size={18} />
              Print Slip
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={resetForNewOrder}>
              <RotateCcw size={18} />
              New Order
            </button>
          </div>
        </div>

        <Modal open={slipOpen} onClose={() => setSlipOpen(false)} title="Kitchen slip" size="lg">
          <SlipPreview
            order={successOrder}
            slipType="KITCHEN"
            settings={settingsForSlip(settings)}
          />
        </Modal>
      </div>
    );
  }

  return (
    <div className="page pos-page">
      <div className="page-header pos-header">
        <div>
          <h1>Place Walk-in Order</h1>
          <p>Point of sale for in-restaurant orders</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost pos-clear-btn"
          onClick={clearCart}
          disabled={cart.length === 0}
        >
          <Trash2 size={16} />
          Clear cart
        </button>
      </div>

      <div className="pos-type-toggle animate-slide-up">
        {ORDER_TYPES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`pos-type-btn ${orderType === key ? 'active' : ''}`}
            onClick={() => setOrderType(key)}
          >
            <Icon size={28} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="pos-layout animate-slide-up">
        <div className="pos-menu panel">
          <PosItemGrid
            items={menuItems}
            categories={categories}
            onAddItem={handleAddItem}
            currency={settings.currency === 'PKR' ? 'PKR' : 'USD'}
          />
        </div>

        <aside className="pos-cart panel">
          <h3 className="pos-cart-title">Order details</h3>

          <div className="pos-cart-fields">
            {orderType === 'DINE_IN' && (
              <div className="form-group">
                <label htmlFor="pos-table">Table number *</label>
                <input
                  id="pos-table"
                  type="text"
                  className="form-control pos-input-lg"
                  placeholder="e.g. T-07"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pos-name">Customer name</label>
                <input
                  id="pos-name"
                  type="text"
                  className="form-control"
                  placeholder="Optional"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="pos-phone">Phone</label>
                <input
                  id="pos-phone"
                  type="tel"
                  className="form-control"
                  placeholder="Optional"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            <p className="pos-token-hint">
              Token will be assigned automatically when the order is placed.
            </p>
          </div>

          <div className="pos-cart-items">
            <h4>Cart ({cart.reduce((s, l) => s + l.quantity, 0)} items)</h4>
            {cart.length === 0 ? (
              <p className="pos-cart-empty">Tap menu items to add them here</p>
            ) : (
              <ul className="pos-cart-list">
                {cart.map((line) => {
                  const key = cartLineKey(line.menuItemId, line.notes);
                  return (
                    <li key={key} className="pos-cart-line">
                      <div className="pos-cart-line-top">
                        <span className="pos-cart-line-name">{line.name}</span>
                        <span className="pos-cart-line-price">
                          {formatPKR(line.unitPrice * line.quantity)}
                        </span>
                      </div>
                      <div className="pos-cart-line-controls">
                        <button
                          type="button"
                          className="pos-qty-btn"
                          onClick={() => updateQty(key, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="pos-qty-value">{line.quantity}</span>
                        <button
                          type="button"
                          className="pos-qty-btn"
                          onClick={() => updateQty(key, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-control pos-line-notes"
                        placeholder="Item notes (optional)"
                        value={line.notes}
                        onChange={(e) => updateNotes(key, e.target.value)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="pos-cart-totals">
            <div><span>Subtotal</span><span>{formatPKR(totals.subtotal)}</span></div>
            <div><span>Tax ({settings.taxPercent}%)</span><span>{formatPKR(totals.tax)}</span></div>
            <div><span>Service ({settings.serviceChargePercent}%)</span><span>{formatPKR(totals.serviceCharge)}</span></div>
            <div className="pos-cart-grand">
              <span>Total</span>
              <span>{formatPKR(totals.total)}</span>
            </div>
          </div>

          <div className="pos-payment">
            <h4>Payment method</h4>
            <div className="pos-payment-btns">
              {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  className={`pos-payment-btn ${paymentMethod === key ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(key)}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg pos-place-btn"
            disabled={cart.length === 0 || placing}
            onClick={handlePlaceOrder}
          >
            {placing ? (
              <>
                <Loader2 size={20} className="pos-spin" />
                Placing order…
              </>
            ) : (
              <>Place Order · {formatPKR(totals.total)}</>
            )}
          </button>
        </aside>
      </div>
    </div>
  );
}
