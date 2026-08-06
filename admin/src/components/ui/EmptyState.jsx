import { Inbox } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state empty-state-component">
      <Icon size={48} strokeWidth={1.25} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {(action || (actionLabel && onAction)) && (
        <div className="empty-state__action">
          {action ?? (
            <button type="button" className="btn btn-primary" onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
