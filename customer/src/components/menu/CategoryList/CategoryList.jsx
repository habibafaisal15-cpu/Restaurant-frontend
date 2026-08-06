function CategoryList({ categories = [], activeCategoryId, onSelect }) {
  return (
    <div className="category-list">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={
            activeCategoryId === category.id
              ? 'category-list__item is-active'
              : 'category-list__item'
          }
          onClick={() => onSelect?.(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

export default CategoryList;
