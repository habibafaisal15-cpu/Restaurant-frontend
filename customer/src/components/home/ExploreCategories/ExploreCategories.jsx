import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import './ExploreCategories.css';

function ExploreCategories({ categories = [] }) {
  const trackRef = useRef(null);

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const amount = Math.min(track.clientWidth * 0.7, 280);
    track.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  if (!categories.length) return null;

  return (
    <section className="explore-menu" id="categories" aria-label="Explore menu">
      <div className="explore-menu__inner page-container">
        <div className="explore-menu__head">
          <h2>
            <span>Explore</span> Menu
          </h2>
          <Link to={ROUTES.MENU} className="explore-menu__view-all">
            View All
          </Link>
        </div>

        <div className="explore-menu__carousel">
          <button
            type="button"
            className="explore-menu__arrow explore-menu__arrow--prev"
            aria-label="Previous categories"
            onClick={() => scrollByCard(-1)}
          >
            ‹
          </button>

          <div className="explore-menu__track" ref={trackRef}>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`${ROUTES.MENU}?category=${category.id}`}
                className="explore-menu__card"
                state={{ scrollToCategory: category.id }}
              >
                <div className="explore-menu__blob">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="explore-menu__placeholder">{category.name}</div>
                  )}
                  <span className="explore-menu__name">{category.name}</span>
                  <span className="explore-menu__rule" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="explore-menu__arrow explore-menu__arrow--next"
            aria-label="Next categories"
            onClick={() => scrollByCard(1)}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}

export default ExploreCategories;
