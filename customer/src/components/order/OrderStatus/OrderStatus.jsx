function OrderStatus({ status }) {
  return (
    <div className="order-status">
      <p>
        Status: <strong>{status || 'pending'}</strong>
      </p>
    </div>
  );
}

export default OrderStatus;
