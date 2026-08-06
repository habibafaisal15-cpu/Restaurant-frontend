import { formatCurrency } from '../../../utils/format';

function CartSummary({ totalItems, totalPrice }) {
  return (
    <div className="cart-summary">
      <p>Items: {totalItems}</p>
      <p>
        <strong>Total: {formatCurrency(totalPrice)}</strong>
      </p>
    </div>
  );
}

export default CartSummary;
