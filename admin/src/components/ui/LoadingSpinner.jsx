import './LoadingSpinner.css';

export default function LoadingSpinner({ size = 40, label = 'Loading…' }) {
  return (
    <div className="loading-spinner" role="status" aria-label={label}>
      <div
        className="loading-spinner__ring"
        style={{ width: size, height: size }}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
