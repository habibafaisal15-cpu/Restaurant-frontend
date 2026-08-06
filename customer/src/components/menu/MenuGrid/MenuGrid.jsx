import MenuItemCard from '../MenuItemCard';

function MenuGrid({ items = [], onAddItem }) {
  if (!items.length) {
    return <p>No items available in this category.</p>;
  }

  return (
    <div className="menu-grid">
      {items.map((item) => (
        <MenuItemCard key={item.id} item={item} onAdd={onAddItem} />
      ))}
    </div>
  );
}

export default MenuGrid;
