import './Sidebar.css';

function Sidebar({ categories = [], activeCategoryId, onSelectCategory }) {
  return (
    <aside className="app-sidebar">
      <h2 className="app-sidebar__title">Categories</h2>
      <ul className="app-sidebar__list">
        <li>
          <button
            type="button"
            className={
              !activeCategoryId
                ? 'app-sidebar__item is-active'
                : 'app-sidebar__item'
            }
            onClick={() => onSelectCategory?.(null)}
          >
            All
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              className={
                activeCategoryId === category.id
                  ? 'app-sidebar__item is-active'
                  : 'app-sidebar__item'
              }
              onClick={() => onSelectCategory?.(category.id)}
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
