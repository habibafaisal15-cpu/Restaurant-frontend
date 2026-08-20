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
  ChevronRight,
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
import * as dealService from '../services/dealService';
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

const POS_DEALS_CATEGORY = { id: '__pos_deals__', name: 'Deals', active: true };

function isDealsCategoryName(name) {
  return String(name || '').trim().toLowerCase() === 'deals';
}

function dealToPosItem(deal) {
  const productId = deal.productId || deal.product_id || null;
  if (!productId) return null;

  return {
    id: productId,
    dealId: deal.id,
    categoryId: POS_DEALS_CATEGORY.id,
    categoryName: POS_DEALS_CATEGORY.name,
    name: deal.title,
    description: deal.description || '',
    price: Number(deal.price) || 0,
    discountPrice: undefined,
    image: deal.image || '',
    available: deal.active !== false,
    active: deal.active !== false,
    badge: deal.badge || '',
  };
}

function settingsForSlip(settings) {
  return {
    name: settings.restaurantName,
    logo: settings.logo,
    address: settings.address,
    phone: settings.phone,
    footer: settings.slipFooter,
    taxRate: settings.taxPercent,
    showName: settings.showNameOnBill !== false,
    showLogo: settings.showLogoOnBill !== false,
    showAddress: settings.showAddressOnBill !== false,
    showPhone: settings.showPhoneOnBill !== false,
  };
}

function calcCartTotals(cart, settings, discountInput = { type: 'fixed', value: 0 }) {
  const subtotal = cart.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const taxPercent = settings.taxPercent ?? 0;
  const servicePercent = settings.serviceChargePercent ?? 0;
  const tax = Math.round(subtotal * (taxPercent / 100));
  const serviceCharge = Math.round(subtotal * (servicePercent / 100));
  const preDiscount = subtotal + tax + serviceCharge;

  const rawValue = Math.max(0, Number(discountInput?.value) || 0);
  let discount = 0;
  if (discountInput?.type === 'percent') {
    const pct = Math.min(rawValue, 100);
    discount = Math.round(subtotal * (pct / 100));
  } else {
    discount = Math.round(rawValue);
  }
  discount = Math.min(discount, preDiscount);

  const total = Math.max(0, preDiscount - discount);
  return { subtotal, tax, serviceCharge, discount, total };
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
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' | 'percent'
  const [discountValue, setDiscountValue] = useState('');

  const [placing, setPlacing] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [slipOpen, setSlipOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState('place'); // 'place' | 'request-bill'
  const [settlingBill, setSettlingBill] = useState(false);

  const loadMenu = useCallback(async () => {
    setLoadingMenu(true);
    try {
      const [items, cats, deals] = await Promise.all([
        menuService.getAll({ available: true }),
        categoryService.getAll(),
        dealService.getAll({ active: true }),
      ]);

      const dealItems = (deals || [])
        .filter((deal) => deal.active !== false)
        .map(dealToPosItem)
        .filter(Boolean);

      const dealProductIds = new Set(dealItems.map((item) => item.id));
      const regularItems = (items || []).filter((item) => !dealProductIds.has(item.id));

      const regularCategories = (cats || []).filter(
        (category) => category.active && !isDealsCategoryName(category.name),
      );

      setMenuItems([...regularItems, ...dealItems]);
      setCategories(
        dealItems.length
          ? [...regularCategories, POS_DEALS_CATEGORY]
          : regularCategories,
      );
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
    () =>
      calcCartTotals(cart, settings, {
        type: discountType,
        value: discountValue,
      }),
    [cart, settings, discountType, discountValue],
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

  const clearCart = () => {
    setCart([]);
    setTableNumber('');
    setCustomerPhone('');
    setDiscountType('fixed');
    setDiscountValue('');
  };

  const resetForNewOrder = () => {
    setSuccessOrder(null);
    setSlipOpen(false);
    clearCart();
    setPaymentMethod('cash');
    setOrderType('DINE_IN');
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast.error('Add items to the cart first');
      return;
    }

    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      toast.error('Table number is required for dine-in orders');
      return;
    }

    // Dine-in opens as an unpaid draft until the customer asks for the bill.
    if (orderType === 'DINE_IN') {
      confirmPlaceOrder('cash', { asDraft: true });
      return;
    }

    setPaymentMode('place');
    setPaymentOpen(true);
  };

  const confirmPlaceOrder = async (method, options = {}) => {
    const asDraft = options.asDraft === true || orderType === 'DINE_IN';
    setPaymentMethod(method);
    setPaymentOpen(false);
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
          name: 'Walk-in Guest',
          phone: customerPhone.trim(),
        },
        tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : undefined,
        paymentMethod: method,
        paymentStatus: asDraft ? 'pending' : 'paid',
        discount: totals.discount > 0 ? totals.discount : 0,
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
      toast.success(
        asDraft
          ? 'Dine-in draft saved — request the bill when ready'
          : 'Order placed successfully!',
      );
    } catch (err) {
      toast.error(err.message ?? 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const handleRequestBill = () => {
    if (!successOrder?.id) return;
    setPaymentMode('request-bill');
    setPaymentOpen(true);
  };

  const confirmRequestBill = async (method) => {
    if (!successOrder?.id) return;
    setPaymentMethod(method);
    setPaymentOpen(false);
    setSettlingBill(true);
    try {
      const settled = await orderService.requestBill(successOrder.id, {
        paymentMethod: method,
        cashierName: user?.name ?? 'Cashier',
      });
      setSuccessOrder({ ...successOrder, ...settled });
      toast.success('Bill settled — you can print the receipt');
      setSlipOpen(true);
    } catch (err) {
      toast.error(err.message ?? 'Failed to request bill');
    } finally {
      setSettlingBill(false);
    }
  };

  const handlePaymentSelect = (method) => {
    if (paymentMode === 'request-bill') {
      confirmRequestBill(method);
      return;
    }
    confirmPlaceOrder(method, { asDraft: false });
  };

  const isDraftOrder =
    successOrder &&
    (successOrder.status === 'draft' ||
      successOrder.orderStatus === 'Draft' ||
      successOrder.paymentStatus === 'pending');

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
          <h1>{isDraftOrder ? 'Draft Saved' : 'Order Placed!'}</h1>
          <p className="pos-success-sub">
            {isDraftOrder
              ? 'Kitchen has the order. This table stays as a draft until the customer asks for the bill.'
              : 'Your walk-in order has been sent to the kitchen.'}
          </p>

          <div className="pos-success-details">
            <div className="pos-success-row">
              <span>Order ID</span>
              <strong>{successOrder.orderNumber}</strong>
            </div>
            {isDraftOrder && (
              <div className="pos-success-row">
                <span>Status</span>
                <strong>Draft · awaiting bill</strong>
              </div>
            )}
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
            {Number(successOrder.discount) > 0 && (
              <div className="pos-success-row">
                <span>Discount applied</span>
                <strong>-{formatPKR(successOrder.discount)}</strong>
              </div>
            )}
          </div>

          <div className="pos-success-actions">
            {isDraftOrder ? (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                disabled={settlingBill}
                onClick={handleRequestBill}
              >
                {settlingBill ? (
                  <>
                    <Loader2 size={18} className="pos-spin" />
                    Settling…
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Request Bill
                  </>
                )}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" onClick={() => setSlipOpen(true)}>
                <Printer size={18} />
                Print Receipt
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-lg" onClick={resetForNewOrder}>
              <RotateCcw size={18} />
              New Order
            </button>
          </div>
        </div>

        <Modal open={slipOpen} onClose={() => setSlipOpen(false)} title="Customer receipt" size="lg">
          <SlipPreview
            order={successOrder}
            slipType="CUSTOMER_RECEIPT"
            settings={settingsForSlip(settings)}
          />
        </Modal>

        <Modal
          open={paymentOpen}
          onClose={() => !settlingBill && setPaymentOpen(false)}
          title="Settle bill"
          size="md"
        >
          <div className="pos-pay-modal">
            <p className="pos-pay-modal-total">
              Amount due <strong>{formatPKR(successOrder.total)}</strong>
            </p>
            <div className="pos-pay-modal-options">
              {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  className={`pos-pay-modal-option ${paymentMethod === key ? 'active' : ''}`}
                  disabled={settlingBill}
                  onClick={() => handlePaymentSelect(key)}
                >
                  <span className="pos-pay-modal-icon" aria-hidden="true">
                    <Icon size={26} strokeWidth={2} />
                  </span>
                  <span className="pos-pay-modal-label">{label}</span>
                  <ChevronRight size={18} className="pos-pay-modal-chevron" />
                </button>
              ))}
            </div>
            <p className="pos-pay-modal-hint">
              Tap a method to settle the draft and print the receipt
            </p>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="page pos-page">
      <div className="pos-layout">
        <div className="pos-top">
          <div className="pos-title-block">
            <h1>Place Walk-in Order</h1>
            <p>Point of sale for in-restaurant orders</p>
          </div>

          <div className="pos-type-toggle" role="group" aria-label="Order type">
            {ORDER_TYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className={`pos-type-btn pos-type-btn--${key === 'DINE_IN' ? 'dine' : 'takeaway'} ${orderType === key ? 'active' : ''}`}
                onClick={() => setOrderType(key)}
                aria-pressed={orderType === key}
              >
                <span className="pos-type-btn-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="pos-type-btn-text">
                  <span className="pos-type-btn-label">{label}</span>
                  <span className="pos-type-btn-hint">
                    {key === 'DINE_IN' ? 'Table service' : 'Counter pickup'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <aside className="pos-cart panel">
          <div className="pos-cart-head">
            <h3 className="pos-cart-title">Order details</h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm pos-clear-btn"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <Trash2 size={15} />
              Clear cart
            </button>
          </div>

          <div className="pos-cart-scroll">
            <div className={`pos-cart-fields ${orderType === 'DINE_IN' ? 'pos-cart-fields--row' : ''}`}>
              {orderType === 'DINE_IN' && (
                <div className="form-group">
                  <label htmlFor="pos-table">Table *</label>
                  <input
                    id="pos-table"
                    type="text"
                    className="form-control pos-cart-field-input"
                    placeholder="T-07"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="pos-phone">Phone</label>
                <input
                  id="pos-phone"
                  type="tel"
                  className="form-control pos-cart-field-input"
                  placeholder="Optional"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="pos-cart-items">
              <div className="pos-cart-items-head">
                <h4>Cart</h4>
                <span className="pos-cart-count">
                  {cart.reduce((s, l) => s + l.quantity, 0)} items
                </span>
              </div>
              {cart.length > 0 && (
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
                        <div className="pos-cart-line-meta">
                          <div className="pos-cart-line-controls">
                            <button
                              type="button"
                              className="pos-qty-btn"
                              onClick={() => updateQty(key, -1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="pos-qty-value">{line.quantity}</span>
                            <button
                              type="button"
                              className="pos-qty-btn"
                              onClick={() => updateQty(key, 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="pos-cart-line-unit">
                            {formatPKR(line.unitPrice)} each
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="pos-cart-footer">
            <div className="pos-discount">
              <div className="pos-discount-head">
                <label htmlFor="pos-discount-value">Discount</label>
                <div className="pos-discount-type" role="group" aria-label="Discount type">
                  <button
                    type="button"
                    className={discountType === 'fixed' ? 'active' : ''}
                    onClick={() => setDiscountType('fixed')}
                    disabled={cart.length === 0}
                  >
                    Rs
                  </button>
                  <button
                    type="button"
                    className={discountType === 'percent' ? 'active' : ''}
                    onClick={() => setDiscountType('percent')}
                    disabled={cart.length === 0}
                  >
                    %
                  </button>
                </div>
              </div>
              <input
                id="pos-discount-value"
                type="number"
                min="0"
                step={discountType === 'percent' ? '1' : '1'}
                max={discountType === 'percent' ? '100' : undefined}
                className="form-control pos-cart-field-input pos-discount-input"
                placeholder={discountType === 'percent' ? '0' : '0'}
                value={discountValue}
                disabled={cart.length === 0}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === '') {
                    setDiscountValue('');
                    return;
                  }
                  const num = Number(next);
                  if (Number.isNaN(num) || num < 0) return;
                  if (discountType === 'percent' && num > 100) {
                    setDiscountValue('100');
                    return;
                  }
                  setDiscountValue(next);
                }}
              />
            </div>

            <div className="pos-cart-totals">
              <div><span>Subtotal</span><span>{formatPKR(totals.subtotal)}</span></div>
              <div><span>Tax ({settings.taxPercent}%)</span><span>{formatPKR(totals.tax)}</span></div>
              <div>
                <span>Service ({settings.serviceChargePercent}%)</span>
                <span>{formatPKR(totals.serviceCharge)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="pos-cart-discount-row">
                  <span>Discount</span>
                  <span>-{formatPKR(totals.discount)}</span>
                </div>
              )}
              <div className="pos-cart-grand">
                <span>Total</span>
                <span>{formatPKR(totals.total)}</span>
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
                  {orderType === 'DINE_IN' ? 'Saving draft…' : 'Placing order…'}
                </>
              ) : orderType === 'DINE_IN' ? (
                <>Save Draft · {formatPKR(totals.total)}</>
              ) : (
                <>Place Order · {formatPKR(totals.total)}</>
              )}
            </button>
          </div>
        </aside>

        <div className="pos-menu panel">
          <PosItemGrid
            items={menuItems}
            categories={categories}
            onAddItem={handleAddItem}
            currency={settings.currency === 'PKR' ? 'PKR' : 'USD'}
          />
        </div>
      </div>

      <Modal
        open={paymentOpen}
        onClose={() => !placing && !settlingBill && setPaymentOpen(false)}
        title={paymentMode === 'request-bill' ? 'Settle bill' : 'Select payment method'}
        size="md"
      >
        <div className="pos-pay-modal">
          <p className="pos-pay-modal-total">
            Amount due{' '}
            <strong>
              {formatPKR(
                paymentMode === 'request-bill'
                  ? (successOrder?.total ?? totals.total)
                  : totals.total,
              )}
            </strong>
          </p>
          <div className="pos-pay-modal-options">
            {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className={`pos-pay-modal-option ${paymentMethod === key ? 'active' : ''}`}
                disabled={placing || settlingBill}
                onClick={() => handlePaymentSelect(key)}
              >
                <span className="pos-pay-modal-icon" aria-hidden="true">
                  <Icon size={26} strokeWidth={2} />
                </span>
                <span className="pos-pay-modal-label">{label}</span>
                <ChevronRight size={18} className="pos-pay-modal-chevron" />
              </button>
            ))}
          </div>
          <p className="pos-pay-modal-hint">
            {paymentMode === 'request-bill'
              ? 'Tap a method to settle the draft and print the receipt'
              : 'Tap a method to confirm and place the order'}
          </p>
        </div>
      </Modal>
    </div>
  );
}
