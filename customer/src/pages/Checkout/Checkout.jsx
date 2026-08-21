import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import OrderForm from '../../components/order/OrderForm';
import OrderRoadmap from '../../components/order/OrderRoadmap';
import PaymentMethod, {
  getPaymentMethodLabel,
} from '../../components/order/PaymentMethod';
import RiderAssignPopup from '../../components/order/RiderAssignPopup';
import { PAYMENT_METHODS, ROUTES, STORAGE_KEYS } from '../../constants';
import { isUuid } from '../../api/adapters';
import { useCart, useLocationContext, useNavDrawer, useOrder } from '../../context';
import {
  DELIVERY_UNAVAILABLE_MESSAGE,
  DeliveryUnavailableError,
  validateAndAssignLocation,
} from '../../services/locationService';
import { placeOrder } from '../../services/orderService';
import {
  formatCardExpiry,
  formatCardNumber,
  formatCvv,
  processPayment,
} from '../../services/paymentService';
import { formatCurrency } from '../../utils/format';
import { pushNotification, rememberOrder } from '../../utils/orderHistory';
import './Checkout.css';

const FLOW_STEPS = [
  { id: 'details', label: 'Details' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Confirm' },
];

const emptyCard = {
  cardName: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvv: '',
  walletPhone: '',
};

function Checkout() {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const {
    branch,
    location,
    applyDeliverableLocation,
    openLocationModal,
    closeLocationModal,
  } = useLocationContext();
  const { setActiveOrder, setRider } = useOrder();
  const { toggleDrawer } = useNavDrawer();
  const [step, setStep] = useState('details');
  const [riderPopup, setRiderPopup] = useState({ open: false, orderId: null });
  const [submitting, setSubmitting] = useState(false);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    phone: '',
    email: '',
    apartment: '',
    city: '',
    deliveryLocation: location?.address || '',
    notes: '',
    paymentMethod: PAYMENT_METHODS.CASH,
    ...emptyCard,
  });

  useEffect(() => {
    if (location?.address) {
      setFormValues((current) => ({
        ...current,
        deliveryLocation: current.deliveryLocation || location.address,
      }));
    }
  }, [location]);

  const finishRiderPopup = useCallback(() => {
    setRiderPopup((current) => {
      const id = current.orderId;
      if (id) {
        navigate(`/order/${id}`, { replace: true });
      }
      return { open: false, orderId: null };
    });
  }, [navigate]);

  const handleRiderReady = useCallback(
    (nextRider) => {
      setRider(nextRider);
    },
    [setRider],
  );

  // Keep checkout mounted while rider popup is open (cart is cleared after order)
  if (!items.length && !riderPopup.open) {
    return <Navigate to={ROUTES.MENU} replace />;
  }

  const stepIndex = Math.max(
    0,
    FLOW_STEPS.findIndex((entry) => entry.id === step)
  );

  const needsCardDetails = formValues.paymentMethod === PAYMENT_METHODS.CARD;
  const needsWalletDetails =
    formValues.paymentMethod === PAYMENT_METHODS.ONLINE;

  const runDeliveryCheck = async (addressText) => {
    const address = String(addressText || '').trim();
    if (!address) {
      setDeliveryStatus({
        type: 'error',
        message: 'Enter a delivery location first.',
      });
      return null;
    }

    setCheckingDelivery(true);
    setDeliveryStatus(null);
    setError(null);

    try {
      const result = await validateAndAssignLocation({
        address,
        lat: location?.lat,
        lng: location?.lng,
      });

      applyDeliverableLocation(result.location, result.branch);
      setDeliveryStatus({
        type: 'ok',
        message: `Delivery available from ${result.branch?.name || 'nearest branch'}.`,
      });
      setFormValues((current) => ({
        ...current,
        deliveryLocation: result.location.address || address,
      }));
      return result;
    } catch (err) {
      const message =
        err instanceof DeliveryUnavailableError
          ? err.message
          : err.message || DELIVERY_UNAVAILABLE_MESSAGE;
      setDeliveryStatus({ type: 'error', message });
      return null;
    } finally {
      setCheckingDelivery(false);
    }
  };

  const handleDetailsContinue = async (values) => {
    const next = { ...formValues, ...values };
    setFormValues(next);
    setError(null);

    const address = String(next.deliveryLocation || '').trim();
    if (address.length < 6) {
      setDeliveryStatus({
        type: 'error',
        message: 'Enter a fuller delivery address.',
      });
      return;
    }

    try {
      const result = await validateAndAssignLocation({
        address,
        lat: location?.lat,
        lng: location?.lng,
      });
      applyDeliverableLocation(result.location, result.branch);
      setDeliveryStatus({
        type: 'ok',
        message: `Delivery available from ${result.branch?.name || 'nearest branch'}.`,
      });
    } catch (err) {
      setDeliveryStatus({
        type: 'error',
        message:
          err instanceof DeliveryUnavailableError
            ? err.message
            : err.message || DELIVERY_UNAVAILABLE_MESSAGE,
      });
      return;
    }

    setPaymentReceipt(null);
    setPaymentError(null);
    setStep('payment');
  };

  const handlePaymentFieldChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === 'cardNumber') nextValue = formatCardNumber(value);
    if (name === 'cardExpiry') nextValue = formatCardExpiry(value);
    if (name === 'cardCvv') nextValue = formatCvv(value);

    setFormValues((current) => ({ ...current, [name]: nextValue }));
    setPaymentError(null);
    setPaymentReceipt(null);
  };

  const handlePayAndContinue = async () => {
    setPaymentError(null);
    setProcessingPayment(true);

    try {
      const receipt = await processPayment({
        method: formValues.paymentMethod,
        amount: totalPrice,
        cardName: formValues.cardName,
        cardNumber: formValues.cardNumber,
        cardExpiry: formValues.cardExpiry,
        cardCvv: formValues.cardCvv,
        walletPhone: formValues.walletPhone,
      });
      setPaymentReceipt(receipt);
      setStep('review');
    } catch (err) {
      setPaymentError(err.message || 'Payment could not be completed.');
      setPaymentReceipt(null);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError(null);

    try {
      let receipt = paymentReceipt;
      if (!receipt) {
        receipt = await processPayment({
          method: formValues.paymentMethod,
          amount: totalPrice,
          cardName: formValues.cardName,
          cardNumber: formValues.cardNumber,
          cardExpiry: formValues.cardExpiry,
          cardCvv: formValues.cardCvv,
          walletPhone: formValues.walletPhone,
        });
        setPaymentReceipt(receipt);
      }

      const hasValidBranch = branch?.id && isUuid(branch.id);
      const checked =
        hasValidBranch && location?.lat != null
          ? { location, branch }
          : await runDeliveryCheck(formValues.deliveryLocation);

      if (!checked) {
        setStep('details');
        setSubmitting(false);
        return;
      }

      const addressParts = [
        formValues.deliveryLocation,
        formValues.apartment,
        formValues.city,
      ]
        .map((part) => String(part || '').trim())
        .filter(Boolean);

      const order = await placeOrder({
        items,
        branchId: checked.branch?.id,
        location: checked.location,
        customer: {
          name: formValues.name,
          phone: formValues.phone,
          email: formValues.email,
          apartment: formValues.apartment,
          city: formValues.city,
          address: addressParts.join(', '),
          notes: formValues.notes,
        },
        paymentMethod: formValues.paymentMethod,
        paymentDetails: {
          status: receipt.status,
          transactionId: receipt.transactionId || null,
          cardLast4: receipt.cardLast4 || '',
          walletPhone: receipt.walletPhone || formValues.walletPhone || '',
          message: receipt.message || '',
        },
      });

      setActiveOrder(order);
      localStorage.setItem(STORAGE_KEYS.ORDER_ID, order.id);
      rememberOrder(order);
      pushNotification({
        title: 'Order placed',
        body: `Order ${order.orderNumber || order.id} is confirmed.`,
        orderId: order.id,
      });
      window.dispatchEvent(new Event('customer-orders'));
      window.dispatchEvent(new Event('customer-notifications'));
      clearCart();
      closeLocationModal();
      setRiderPopup({ open: true, orderId: order.id });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const introByStep = {
    details: {
      title: 'Customer details',
      lead: 'Fill in your details so we can deliver your order.',
    },
    payment: {
      title: 'Payment',
      lead: 'Choose a method, then continue.',
    },
    review: {
      title: 'Confirm order',
      lead: 'Review everything once, then place your order.',
    },
  };

  return (
    <section className="checkout-page">
      <RiderAssignPopup
        open={riderPopup.open}
        orderId={riderPopup.orderId}
        onRiderReady={handleRiderReady}
        onClose={finishRiderPopup}
      />

      {riderPopup.open ? null : (
        <>
      <header className="checkout-page__top">
        <nav className="checkout-page__pill" aria-label="Checkout controls">
          <Link
            to={ROUTES.CART}
            className="checkout-page__icon"
            aria-label="Back to cart"
          >
            ←
          </Link>
          <button
            type="button"
            className="checkout-page__icon checkout-page__icon--burger"
            aria-label="Open menu"
            onClick={toggleDrawer}
          >
            <span />
            <span />
            <span />
          </button>
          <span className="checkout-page__divider" aria-hidden="true" />
          <h1 className="checkout-page__title">Checkout</h1>
        </nav>
      </header>

      <div className="checkout-page__shell">
        <OrderRoadmap currentStep="checkout" />

        <ol className="checkout-flow" aria-label="Checkout steps">
          {FLOW_STEPS.map((entry, index) => {
            const status =
              index < stepIndex
                ? 'done'
                : index === stepIndex
                  ? 'current'
                  : 'upcoming';

            return (
              <li
                key={entry.id}
                className={`checkout-flow__step is-${status}`}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                <span className="checkout-flow__index">{index + 1}</span>
                <span className="checkout-flow__label">{entry.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="checkout-page__layout">
          <div className="checkout-page__main">
            <div className="checkout-page__intro">
              <h2 className="checkout-page__heading">
                {introByStep[step].title}
              </h2>
              <p className="checkout-page__lead">{introByStep[step].lead}</p>
              {step === 'details' && (
                <button
                  type="button"
                  className="checkout-page__map-btn"
                  onClick={openLocationModal}
                >
                  Set location on map
                </button>
              )}
            </div>

            {step === 'details' && (
              <OrderForm
                values={formValues}
                onChange={(next) => {
                  setFormValues((current) => ({ ...current, ...next }));
                  setDeliveryStatus(null);
                }}
                onSubmit={handleDetailsContinue}
                onCheckDelivery={(address) => runDeliveryCheck(address)}
                deliveryStatus={deliveryStatus}
                checkingDelivery={checkingDelivery}
                submitting={checkingDelivery}
              />
            )}

            {step === 'payment' && (
              <div className="order-form checkout-panel">
                <PaymentMethod
                  value={formValues.paymentMethod}
                  onChange={(paymentMethod) => {
                    setFormValues((current) => ({
                      ...current,
                      paymentMethod,
                    }));
                    setPaymentError(null);
                    setPaymentReceipt(null);
                  }}
                />

                {needsCardDetails && (
                  <div className="order-form__section checkout-payment-fields">
                    <h3 className="order-form__section-title">Card details</h3>
                    <Input
                      label="Name on card"
                      name="cardName"
                      value={formValues.cardName || ''}
                      onChange={handlePaymentFieldChange}
                      placeholder="As printed on card"
                    />
                    <Input
                      label="Card number"
                      name="cardNumber"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={formValues.cardNumber || ''}
                      onChange={handlePaymentFieldChange}
                      placeholder="0000 0000 0000 0000"
                    />
                    <div className="order-form__grid">
                      <Input
                        label="Expiry"
                        name="cardExpiry"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        value={formValues.cardExpiry || ''}
                        onChange={handlePaymentFieldChange}
                        placeholder="MM/YY"
                      />
                      <Input
                        label="CVV"
                        name="cardCvv"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={formValues.cardCvv || ''}
                        onChange={handlePaymentFieldChange}
                        placeholder="123"
                      />
                    </div>
                  </div>
                )}

                {needsWalletDetails && (
                  <div className="order-form__section checkout-payment-fields">
                    <h3 className="order-form__section-title">Wallet details</h3>
                    <Input
                      label="Mobile wallet number"
                      name="walletPhone"
                      type="tel"
                      value={formValues.walletPhone || ''}
                      onChange={handlePaymentFieldChange}
                      placeholder="03XXXXXXXXX"
                    />
                  </div>
                )}

                {formValues.paymentMethod === PAYMENT_METHODS.CASH && (
                  <p className="checkout-payment-hint">
                    Cash on delivery — pay the rider when your order arrives.
                  </p>
                )}

                {paymentError && <p className="error-text">{paymentError}</p>}

                <div className="checkout-actions">
                  <button
                    type="button"
                    className="checkout-actions__back"
                    onClick={() => setStep('details')}
                    disabled={processingPayment}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="checkout-actions__next"
                    onClick={handlePayAndContinue}
                    disabled={processingPayment}
                  >
                    {processingPayment
                      ? 'Processing...'
                      : formValues.paymentMethod === PAYMENT_METHODS.CASH
                        ? 'Continue to confirm'
                        : 'Pay & continue'}
                  </button>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="order-form checkout-panel">
                <div className="checkout-review">
                  <section className="checkout-review__block">
                    <div className="checkout-review__head">
                      <h3>Delivery</h3>
                      <button
                        type="button"
                        className="checkout-review__edit"
                        onClick={() => setStep('details')}
                      >
                        Edit
                      </button>
                    </div>
                    <p>
                      <strong>{formValues.name}</strong>
                      <br />
                      {formValues.phone}
                      <br />
                      {formValues.email}
                    </p>
                    <p>
                      {[
                        formValues.deliveryLocation,
                        formValues.apartment,
                        formValues.city,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {formValues.notes?.trim() && (
                      <p className="checkout-review__notes">
                        Note: {formValues.notes}
                      </p>
                    )}
                  </section>

                  <section className="checkout-review__block">
                    <div className="checkout-review__head">
                      <h3>Payment</h3>
                      <button
                        type="button"
                        className="checkout-review__edit"
                        onClick={() => {
                          setPaymentReceipt(null);
                          setStep('payment');
                        }}
                      >
                        Edit
                      </button>
                    </div>
                    <p>
                      <strong>
                        {getPaymentMethodLabel(formValues.paymentMethod)}
                      </strong>
                    </p>
                    {paymentReceipt?.status === 'paid' && (
                      <p className="checkout-review__paid">
                        Paid · {paymentReceipt.transactionId}
                      </p>
                    )}
                    {paymentReceipt?.status === 'pending_cod' && (
                      <p>Pay on delivery</p>
                    )}
                    {needsCardDetails && paymentReceipt?.cardLast4 && (
                      <p>Card ending ····{paymentReceipt.cardLast4}</p>
                    )}
                    {needsWalletDetails && (
                      <p>
                        Wallet:{' '}
                        {paymentReceipt?.walletPhone || formValues.walletPhone}
                      </p>
                    )}
                  </section>
                </div>

                {error && <p className="error-text">{error}</p>}

                <div className="checkout-actions">
                  <button
                    type="button"
                    className="checkout-actions__back"
                    onClick={() => {
                      setPaymentReceipt(null);
                      setStep('payment');
                    }}
                    disabled={submitting}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="checkout-actions__next"
                    onClick={handlePlaceOrder}
                    disabled={submitting || checkingDelivery}
                  >
                    {submitting ? 'Placing order...' : 'Place order'}
                  </button>
                </div>
              </div>
            )}

            {error && step !== 'review' && (
              <p className="error-text">{error}</p>
            )}
          </div>

          <aside className="checkout-page__aside" aria-label="Order summary">
            <div className="checkout-page__summary">
              <h2 className="checkout-page__summary-title">Order summary</h2>

              <ul className="checkout-page__summary-list">
                {items.map((item) => (
                  <li key={item.id} className="checkout-page__summary-item">
                    <div className="checkout-page__summary-meta">
                      <span className="checkout-page__summary-name">
                        {item.name}
                      </span>
                      <span className="checkout-page__summary-qty">
                        ×{item.quantity}
                      </span>
                    </div>
                    <strong>
                      {formatCurrency(item.price * item.quantity)}
                    </strong>
                  </li>
                ))}
              </ul>

              <div className="checkout-page__summary-rows">
                <div className="checkout-page__summary-row">
                  <span>
                    Subtotal ({totalItems} item{totalItems === 1 ? '' : 's'})
                  </span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="checkout-page__summary-row">
                  <span>Delivery</span>
                  <span>By branch</span>
                </div>
                <div className="checkout-page__summary-row">
                  <span>Payment</span>
                  <span>{getPaymentMethodLabel(formValues.paymentMethod)}</span>
                </div>
                {paymentReceipt?.status === 'paid' && (
                  <div className="checkout-page__summary-row checkout-page__summary-row--ok">
                    <span>Status</span>
                    <span>Paid</span>
                  </div>
                )}
              </div>

              <div className="checkout-page__summary-total">
                <span>Total payable</span>
                <strong>{formatCurrency(totalPrice)}</strong>
              </div>

              {branch?.name && (
                <p className="checkout-page__summary-branch">
                  From {branch.name}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
        </>
      )}
    </section>
  );
}

export default Checkout;
