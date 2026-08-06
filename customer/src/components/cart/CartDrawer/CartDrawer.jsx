import CartItem from '../CartItem';
import './CartDrawer.css';

function CartDrawer({
  items = [],
  onIncrease,
  onDecrease,
  onRemove,
}) {
  return (
    <div className="cart-drawer">
      {items.length === 0 ? (
        <div className="cart-drawer__empty">
          <p>Your cart is empty.</p>
          <span>Add something delicious from the menu.</span>
        </div>
      ) : (
        <ul className="cart-drawer__list">
          {items.map((item) => (
            <li key={item.id}>
              <CartItem
                item={item}
                onIncrease={onIncrease}
                onDecrease={onDecrease}
                onRemove={onRemove}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CartDrawer;
