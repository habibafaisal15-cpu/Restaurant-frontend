import { Globe, UtensilsCrossed, ShoppingBag, Footprints } from 'lucide-react';
import './BadgeVariants.css';

const CHANNEL_CONFIG = {
  online: {
    label: 'Online',
    variant: 'online',
    Icon: Globe,
  },
  dine_in: {
    label: 'Dine-in',
    variant: 'dine-in',
    Icon: UtensilsCrossed,
  },
  takeaway: {
    label: 'Takeaway',
    variant: 'takeaway',
    Icon: ShoppingBag,
  },
  walkin: {
    label: 'Walk-in',
    variant: 'walkin',
    Icon: Footprints,
  },
};

function resolveChannel(channel, orderType) {
  const ch = String(channel ?? '').toUpperCase();
  const type = String(orderType ?? '').toUpperCase();

  if (ch === 'ONLINE') return CHANNEL_CONFIG.online;
  if (ch === 'IN_RESTAURANT' && type === 'DINE_IN') return CHANNEL_CONFIG.dine_in;
  if (ch === 'IN_RESTAURANT' && type === 'TAKEAWAY') return CHANNEL_CONFIG.takeaway;
  return CHANNEL_CONFIG.walkin;
}

export default function ChannelBadge({ channel, orderType, className = '' }) {
  const { label, variant, Icon } = resolveChannel(channel, orderType);

  return (
    <span className={`badge channel-badge channel-badge--${variant} ${className}`.trim()}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}
