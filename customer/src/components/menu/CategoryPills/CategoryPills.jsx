import { Link } from 'react-router-dom';
import './CategoryPills.css';

function CategoryPills({ categories = [], activeCategoryId, onSelect }) {
  return (
    <div className="category-pills" aria-label="Explore categories">
      <div className="category-pills__track">
        {categories.map((category) => {
          const className =
            activeCategoryId === category.id
              ? 'category-pills__item is-active'
              : 'category-pills__item';

          if (category.to) {
            return (
              <Link
                key={category.id}
                to={category.to}
                className={className}
              >
                {category.name}
              </Link>
            );
          }

          return (
            <button
              key={category.id}
              type="button"
              className={className}
              onClick={() => onSelect?.(category.id)}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryPills;
