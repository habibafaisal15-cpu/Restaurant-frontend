import { formatCurrency } from '../../../utils/format';

function MenuItemCard({ item, onAdd }) {
  return (
    <article className="menu-item-card">
      {item.image && (
        <img src={item.image} alt={item.name} className="menu-item-card__image" />
      )}
      <div className="menu-item-card__body">
        <h3>{item.name}</h3>
        {item.description && <p>{item.description}</p>}
        <div className="menu-item-card__footer">
          <span>{formatCurrency(item.price)}</span>
          <button type="button" onClick={() => onAdd?.(item)}>
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

export default MenuItemCard;
