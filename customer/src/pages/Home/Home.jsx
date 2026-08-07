import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BestSellers from '../../components/home/BestSellers';
import ExploreCategories from '../../components/home/ExploreCategories';
import Hero from '../../components/home/Hero';
import TopDeals from '../../components/home/TopDeals';
import { ROUTES } from '../../constants';
import { useLocationContext } from '../../context';
import { useCategoryMetrics } from '../../hooks/useCategoryMetrics';
import { useReveal } from '../../hooks/useReveal';
import './Home.css';

function Home() {
  const { hasLocation, branch, openLocationModal } = useLocationContext();
  const { categories, bestSellers, deals } = useCategoryMetrics(branch?.id);
  const { hash } = useLocation();
  useReveal();

  useEffect(() => {
    if (!hasLocation) openLocationModal();
  }, [hasLocation, openLocationModal]);

  useEffect(() => {
    if (!hash) return undefined;

    const id = hash.replace('#', '');
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <div className="home-page">
      <Hero categories={categories} />

      <div className="reveal">
        <ExploreCategories categories={categories} />
      </div>

      <div className="reveal reveal-delay-1">
        <BestSellers items={bestSellers} />
      </div>

      <div className="reveal reveal-delay-2">
        <TopDeals deals={deals} />
      </div>

      <section className="home-page__panel page-container reveal reveal-delay-3">
        <div className="home-page__next">
          {!hasLocation ? (
            <Link to={ROUTES.LOCATION} className="home-page__next-link">
              Choose location to start ordering
            </Link>
          ) : (
            <p>
              Serving from <strong>{branch?.name || 'your nearest branch'}</strong>
              {' · '}
              <Link to={ROUTES.MENU}>Open full menu</Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
