import './BadgeVariants.css';

const STATUS_CONFIG = {
  pending: { label: 'Pending', variant: 'warning' },
  placed: { label: 'Placed', variant: 'warning' },
  confirmed: { label: 'Accepted', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'info' },
  sent_to_kitchen: { label: 'Sent to Kitchen', variant: 'copper' },
  preparing: { label: 'Preparing', variant: 'info' },
  order_prepared: { label: 'Order Prepared', variant: 'copper' },
  ready: { label: 'Ready', variant: 'copper' },
  rider_assigned: { label: 'Rider Assigned', variant: 'copper' },
  out_for_delivery: { label: 'Out for Delivery', variant: 'info' },
  delivered: { label: 'Delivered', variant: 'success' },
  served: { label: 'Served', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

function formatStatus(status) {
  if (!status) return 'Unknown';
  return String(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ status, className = '' }) {
  const key = String(status ?? '').toLowerCase();
  const config = STATUS_CONFIG[key] ?? {
    label: formatStatus(status),
    variant: 'default',
  };

  return (
    <span className={`badge status-badge status-badge--${config.variant} ${className}`.trim()}>
      {config.label}
    </span>
  );
}
