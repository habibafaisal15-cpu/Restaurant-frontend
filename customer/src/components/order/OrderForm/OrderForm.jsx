import Input from '../../common/Input';
import './OrderForm.css';

function OrderForm({
  values,
  onChange,
  onSubmit,
  onCheckDelivery,
  deliveryStatus = null,
  checkingDelivery = false,
  submitting = false,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange?.({ ...values, [name]: value });
  };

  return (
    <form
      className="order-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(values);
      }}
    >
      <div className="order-form__section">
        <h3 className="order-form__section-title">Contact</h3>
        <div className="order-form__grid">
          <Input
            label="Full name"
            name="name"
            value={values.name || ''}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={values.phone || ''}
            onChange={handleChange}
            placeholder="03XX XXXXXXX"
            required
          />
        </div>
        <Input
          label="Email"
          name="email"
          type="email"
          value={values.email || ''}
          onChange={handleChange}
          placeholder="you@email.com"
          required
        />
      </div>

      <div className="order-form__section">
        <h3 className="order-form__section-title">Delivery address</h3>
        <div className="order-form__location">
          <label className="input-field" htmlFor="deliveryLocation">
            <span className="input-field__label">Street address / area</span>
            <textarea
              id="deliveryLocation"
              name="deliveryLocation"
              rows={3}
              value={values.deliveryLocation || ''}
              onChange={handleChange}
              placeholder="House / street, landmark, area"
              required
            />
          </label>

          <div className="order-form__grid">
            <Input
              label="Apartment / floor / suite"
              name="apartment"
              value={values.apartment || ''}
              onChange={handleChange}
              placeholder="Optional"
            />
            <Input
              label="City"
              name="city"
              value={values.city || ''}
              onChange={handleChange}
              placeholder="Karachi"
              required
            />
          </div>

          <button
            type="button"
            className="order-form__check"
            onClick={() => onCheckDelivery?.(values.deliveryLocation)}
            disabled={checkingDelivery || !values.deliveryLocation?.trim()}
          >
            {checkingDelivery ? 'Checking...' : 'Check delivery'}
          </button>

          {deliveryStatus?.type === 'ok' && (
            <p className="order-form__delivery-ok">{deliveryStatus.message}</p>
          )}
          {deliveryStatus?.type === 'error' && (
            <p className="order-form__delivery-error">{deliveryStatus.message}</p>
          )}
        </div>
      </div>

      <div className="order-form__section">
        <h3 className="order-form__section-title">Order notes</h3>
        <label className="input-field" htmlFor="notes">
          <span className="input-field__label">
            Delivery instructions (optional)
          </span>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={values.notes || ''}
            onChange={handleChange}
            placeholder="Gate code, ring doorbell, spice level, allergies…"
          />
        </label>
      </div>

      <button type="submit" disabled={submitting || checkingDelivery}>
        Continue to payment
      </button>
    </form>
  );
}

export default OrderForm;
