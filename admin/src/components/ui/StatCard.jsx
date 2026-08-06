import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatCard.css';

export default function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  accent = 'copper',
}) {
  const trendNum = trend != null ? Number(trend) : null;
  const isPositive = trendNum != null && trendNum >= 0;

  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card__accent" aria-hidden="true" />

      <div className="stat-card__top">
        {Icon && (
          <div className="stat-card__icon">
            <Icon size={20} />
          </div>
        )}
        {trendNum != null && (
          <span className={`stat-card__trend ${isPositive ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? '+' : ''}
            {trendNum}%
          </span>
        )}
      </div>

      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {subValue && <p className="stat-card__sub">{subValue}</p>}
    </div>
  );
}
