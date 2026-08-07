import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../../../constants';
import { useLocationContext } from '../../../context';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import Header from '../../layout/Header';
import {
  buildHeroSlides,
  fetchHeroContent,
} from '../../../services/heroService';
import heroKitchenImage from '../../../assets/images/hero-kitchen.png';
import './Hero.css';

const ROTATE_MS = 5500;

function slidesKey(slides) {
  return slides.map((slide) => `${slide.id}:${slide.image}`).join('|');
}

function Hero({ categories = [] }) {
  const { branch } = useLocationContext();
  const { restaurantName } = useSiteSettings();
  const displayName = restaurantName || APP_NAME;

  const categorySlides = useMemo(
    () => buildHeroSlides(categories),
    [categories]
  );

  const [slides, setSlides] = useState(categorySlides);
  const [sideCards, setSideCards] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setSlides((current) =>
      slidesKey(current) === slidesKey(categorySlides)
        ? current
        : categorySlides
    );
  }, [categorySlides]);

  useEffect(() => {
    let active = true;

    fetchHeroContent(branch?.id, []).then((content) => {
      if (!active) return;

      if (content.slides?.length) {
        setSlides((current) =>
          slidesKey(current) === slidesKey(content.slides)
            ? current
            : content.slides
        );
      }

      setSideCards(content.sideCards || []);
    });

    return () => {
      active = false;
    };
  }, [branch?.id]);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [slides]);

  useEffect(() => {
    setActiveIndex((current) => (current >= slides.length ? 0 : current));
  }, [slides.length]);

  const activeSlide = slides[activeIndex] || slides[0] || null;
  const hasCmsSlides = slides.length > 0;

  return (
    <section className="hero" aria-label="Welcome">
      <div className="hero__stage">
        <div className="hero__showcase">
          <div className="hero__media" aria-hidden="true">
            <div
              className={
                hasCmsSlides
                  ? 'hero__slide hero__slide--base'
                  : 'hero__slide hero__slide--base is-active'
              }
              style={{ backgroundImage: `url('${heroKitchenImage}')` }}
            />
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={
                  index === activeIndex
                    ? 'hero__slide is-active'
                    : 'hero__slide'
                }
                style={{ backgroundImage: `url('${slide.image}')` }}
              />
            ))}
            <div className="hero__veil" />
          </div>

          <Header variant="overlay" />

          <div className="hero__footer-row">
            <h1 className="hero__title" key={activeSlide?.id || activeIndex}>
              {activeSlide?.title || activeSlide?.name || displayName}
            </h1>
          </div>
        </div>

        {sideCards.length > 0 && (
          <aside className="hero__rail" aria-label="Quick links">
            {sideCards.map((card) => (
              <Link
                key={card.id}
                to={card.to}
                className="hero__card"
                style={{ backgroundImage: `url('${card.image}')` }}
              >
                <span className="hero__card-label">
                  {card.label}
                  <span className="hero__card-arrow" aria-hidden="true">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </aside>
        )}
      </div>
    </section>
  );
}

export default Hero;
