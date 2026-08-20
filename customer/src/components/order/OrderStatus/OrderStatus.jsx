const STATUS_LABELS = {
  pending: 'Confirmed',
  confirmed: 'Confirmed',
  sent_to_kitchen: 'Confirmed',
  preparing: 'Preparing',
  order_prepared: 'Ready',
  rider_assigned: 'Rider assigned',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function OrderStatus({ status }) {
  const key = String(status || 'pending').toLowerCase();
  const label = STATUS_LABELS[key] || status || 'Pending';

  return (
    <div className="order-status">
      <p>
        Status: <strong>{label}</strong>
      </p>
    </div>
  );
}

export default OrderStatus;
