import { Link } from 'react-router-dom';
import CartDrawer from '../../components/cart/CartDrawer';
import OrderRoadmap from '../../components/order/OrderRoadmap';
import { ROUTES } from '../../constants';
import { useCart, useNavDrawer } from '../../context';
import { formatCurrency } from '../../utils/format';
import './Cart.css';

function Cart() {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
  } = useCart();
  const { toggleDrawer } = useNavDrawer();

  return (
    <section className="cart-page">
      <header className="cart-page__top">
        <nav className="cart-page__pill" aria-label="Cart controls">
          <Link
            to={ROUTES.MENU}
            className="cart-page__icon"
            aria-label="Back to menu"
          >
            ←
          </Link>
          <button
            type="button"
            className="cart-page__icon cart-page__icon--burger"
            aria-label="Open menu"
            onClick={toggleDrawer}
          >
            <span />
            <span />
            <span />
          </button>
          <span className="cart-page__divider" aria-hidden="true" />
          <h1 className="cart-page__title">Cart</h1>
        </nav>
      </header>

      <div className="cart-page__shell">
        <OrderRoadmap currentStep="cart" />

        <div className="cart-page__layout">
          <div className="cart-page__main">
            <CartDrawer
              items={items}
              onIncrease={(id) => {
                const item = items.find((entry) => entry.id === id);
                if (item) updateQuantity(id, item.quantity + 1);
              }}
              onDecrease={(id) => {
                const item = items.find((entry) => entry.id === id);
                if (item) updateQuantity(id, item.quantity - 1);
              }}
              onRemove={removeItem}
            />
          </div>

          <aside className="cart-page__aside">
            {items.length > 0 ? (
              <div className="cart-page__actions">
                <div className="cart-page__total">
                  <span>
                    {totalItems} item{totalItems === 1 ? '' : 's'}
                  </span>
                  <strong>{formatCurrency(totalPrice)}</strong>
                </div>
                <p className="cart-page__note">
                  Review your items, then continue to checkout.
                </p>
                <Link to={ROUTES.CHECKOUT} className="cart-page__checkout">
                  Continue to checkout
                </Link>
              </div>
            ) : (
              <div className="cart-page__actions">
                <div className="cart-page__total">
                  <span>Your cart</span>
                  <strong>Empty</strong>
                </div>
                <Link
                  to={ROUTES.MENU}
                  className="cart-page__checkout cart-page__checkout--ghost"
                >
                  Browse menu
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

export default Cart;
