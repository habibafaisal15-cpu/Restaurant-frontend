import { useCallback, useEffect, useState } from 'react';
import { Save, Image as ImageIcon, Plus, Trash2, Pencil, Images } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploadField from '../ui/ImageUploadField';
import LoadingSpinner from '../ui/LoadingSpinner';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import * as heroService from '../../services/heroService';
import { MAX_SLIDES, MAX_SIDE_CARDS, SIDE_PRESETS } from '../../services/heroService';
import './HomeHeroSettings.css';

function emptySlide(sortOrder) {
  return {
    id: `temp-slide-${Date.now()}-${sortOrder}`,
    image: '',
    title: '',
    active: true,
    sortOrder,
  };
}

function emptyCard(sortOrder) {
  return {
    id: `temp-side-${Date.now()}-${sortOrder}`,
    key: 'menu',
    title: 'Menu',
    image: '',
    link: '/menu',
    sortOrder,
  };
}

export default function HomeHeroSettings() {
  const [loading, setLoading] = useState(true);
  const [savingSlides, setSavingSlides] = useState(false);
  const [savingCards, setSavingCards] = useState(false);
  const [slides, setSlides] = useState([]);
  const [sideCards, setSideCards] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [slideModal, setSlideModal] = useState(null); // { mode: 'add'|'edit', slide }
  const [cardModal, setCardModal] = useState(null);
  const [slideForm, setSlideForm] = useState({ image: '', title: '', active: true });
  const [cardForm, setCardForm] = useState({ key: 'menu', title: '', image: '', link: '' });
  const [removeSlideId, setRemoveSlideId] = useState(null);
  const [removeCardId, setRemoveCardId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const content = await heroService.getContent();
      setSlides(content.slides.map((s) => ({ ...s })));
      setSideCards(content.sideCards.map((c) => ({ ...c })));
    } catch {
      toast.error('Failed to load hero content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeSlides = slides.filter((s) => s.active && s.image);
  const preview = activeSlides[previewIndex] ?? activeSlides[0] ?? null;

  useEffect(() => {
    if (previewIndex >= activeSlides.length) {
      setPreviewIndex(Math.max(0, activeSlides.length - 1));
    }
  }, [activeSlides.length, previewIndex]);

  /* ---- Slides ---- */
  const openAddSlide = () => {
    if (slides.length >= MAX_SLIDES) {
      toast.error(`Maximum ${MAX_SLIDES} slides allowed`);
      return;
    }
    setSlideForm({ image: '', title: '', active: true });
    setSlideModal({ mode: 'add' });
  };

  const openEditSlide = (slide) => {
    setSlideForm({
      image: slide.image ?? '',
      title: slide.title ?? '',
      active: Boolean(slide.active),
    });
    setSlideModal({ mode: 'edit', slide });
  };

  const saveSlideModal = () => {
    if (!slideForm.image.trim()) {
      toast.error('Slide picture is required');
      return;
    }

    if (slideModal.mode === 'add') {
      const next = emptySlide(slides.length + 1);
      setSlides((prev) => [
        ...prev,
        {
          ...next,
          image: slideForm.image.trim(),
          title: slideForm.title.trim(),
          active: slideForm.active,
        },
      ]);
      toast.success('Slide added — click Save slides');
    } else {
      const id = slideModal.slide.id;
      setSlides((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                image: slideForm.image.trim(),
                title: slideForm.title.trim(),
                active: slideForm.active && Boolean(slideForm.image.trim()),
              }
            : s,
        ),
      );
      toast.success('Slide updated — click Save slides');
    }
    setSlideModal(null);
  };

  const confirmRemoveSlide = () => {
    if (!removeSlideId) return;
    setSlides((prev) =>
      prev
        .filter((s) => s.id !== removeSlideId)
        .map((s, i) => ({ ...s, sortOrder: i + 1 })),
    );
    setRemoveSlideId(null);
    toast.success('Slide removed — click Save slides');
  };

  const handleSaveSlides = async () => {
    setSavingSlides(true);
    try {
      const saved = await heroService.updateSlides(slides);
      setSlides(saved.map((s) => ({ ...s })));
      toast.success('Hero slides saved');
    } catch (err) {
      toast.error(err.message ?? 'Failed to save slides');
    } finally {
      setSavingSlides(false);
    }
  };

  /* ---- Side cards ---- */
  const usedKeys = sideCards.map((c) => c.key);

  const openAddCard = () => {
    if (sideCards.length >= MAX_SIDE_CARDS) {
      toast.error(`Maximum ${MAX_SIDE_CARDS} cards (Menu, Top Seller, Deals)`);
      return;
    }
    const available = SIDE_PRESETS.find((p) => !usedKeys.includes(p.key)) || SIDE_PRESETS[0];
    setCardForm({
      key: available.key,
      title: available.title,
      image: '',
      link: available.link,
    });
    setCardModal({ mode: 'add' });
  };

  const openEditCard = (card) => {
    setCardForm({
      key: card.key,
      title: card.title ?? '',
      image: card.image ?? '',
      link: card.link ?? '',
    });
    setCardModal({ mode: 'edit', card });
  };

  const saveCardModal = () => {
    if (!cardForm.image.trim()) {
      toast.error('Card picture is required');
      return;
    }
    if (!cardForm.title.trim()) {
      toast.error('Card title is required');
      return;
    }

    const preset = SIDE_PRESETS.find((p) => p.key === cardForm.key);

    if (cardModal.mode === 'add') {
      if (sideCards.some((c) => c.key === cardForm.key)) {
        toast.error('This card already exists');
        return;
      }
      const next = emptyCard(sideCards.length + 1);
      setSideCards((prev) => [
        ...prev,
        {
          ...next,
          key: cardForm.key,
          title: cardForm.title.trim() || preset?.title,
          image: cardForm.image.trim(),
          link: cardForm.link || preset?.link || '/',
        },
      ]);
      toast.success('Card added — click Save pictures');
    } else {
      const id = cardModal.card.id;
      setSideCards((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                key: cardForm.key,
                title: cardForm.title.trim(),
                image: cardForm.image.trim(),
                link: cardForm.link || preset?.link || c.link,
              }
            : c,
        ),
      );
      toast.success('Card updated — click Save pictures');
    }
    setCardModal(null);
  };

  const confirmRemoveCard = () => {
    if (!removeCardId) return;
    setSideCards((prev) =>
      prev
        .filter((c) => c.id !== removeCardId)
        .map((c, i) => ({ ...c, sortOrder: i + 1 })),
    );
    setRemoveCardId(null);
    toast.success('Card removed — click Save pictures');
  };

  const handleSaveCards = async () => {
    setSavingCards(true);
    try {
      const saved = await heroService.updateSideCards(sideCards);
      setSideCards(saved.map((c) => ({ ...c })));
      toast.success('Home cards saved');
    } catch (err) {
      toast.error(err.message ?? 'Failed to save cards');
    } finally {
      setSavingCards(false);
    }
  };

  if (loading) {
    return (
      <section className="panel settings-hero-section home-hero-settings home-hero-settings--loading">
        <LoadingSpinner />
      </section>
    );
  }

  return (
    <section className="settings-hero-section home-hero-settings animate-slide-up">
      <div className="settings-section-head settings-hero-head">
        <Images size={20} />
        <div>
          <h2 className="settings-section-title">Customer Home Hero</h2>
          <p className="settings-hero-sub">
            Up to 5 rotating slides plus Menu, Top Seller, and Deals cards — shown on the
            customer website home screen.
          </p>
        </div>
      </div>

      <div className="hero-simple-layout">
        <div className="hero-simple-preview panel">
          <h3 className="panel-title">Customer preview</h3>
          <div className="hero-simple-stage">
            {preview?.image ? (
              <img src={preview.image} alt="" className="hero-simple-stage-img" />
            ) : (
              <div className="hero-simple-stage-empty">
                <ImageIcon size={32} />
                <span>No active slides yet</span>
              </div>
            )}
            {preview?.title && (
              <div className="hero-simple-stage-title">{preview.title}</div>
            )}
          </div>

          {activeSlides.length > 1 && (
            <div className="hero-simple-dots">
              {activeSlides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`hero-simple-dot ${i === previewIndex ? 'active' : ''}`}
                  onClick={() => setPreviewIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          <div className="hero-simple-side-preview">
            {sideCards.length === 0 ? (
              <p className="hero-preview-empty-cards">No home cards</p>
            ) : (
              sideCards.map((card) => (
                <div key={card.id} className="hero-simple-side-card">
                  {card.image ? (
                    <img src={card.image} alt={card.title} />
                  ) : (
                    <div className="hero-simple-side-empty">{card.title}</div>
                  )}
                  <span>{card.title}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="hero-simple-editors">
          {/* Slides */}
          <div className="panel">
            <div className="hero-simple-section-head">
              <div>
                <h3 className="panel-title">Rotating hero slides</h3>
                <p>
                  {slides.length}/{MAX_SLIDES} slides — add, edit, or remove
                </p>
              </div>
              <div className="hero-section-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={openAddSlide}
                  disabled={slides.length >= MAX_SLIDES}
                >
                  <Plus size={14} />
                  Add slide
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveSlides}
                  disabled={savingSlides}
                >
                  <Save size={14} />
                  {savingSlides ? 'Saving…' : 'Save slides'}
                </button>
              </div>
            </div>

            {slides.length === 0 ? (
              <div className="hero-empty-block">
                <p>No slides yet. Use Add slide to upload the first picture.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={openAddSlide}>
                  <Plus size={14} />
                  Add slide
                </button>
              </div>
            ) : (
              <div className="hero-slide-slots">
                {slides.map((slide, index) => (
                  <div key={slide.id} className="hero-slide-slot">
                    <div className="hero-slide-slot-head">
                      <strong>Slide {index + 1}</strong>
                      <span className={`hero-slot-status ${slide.active && slide.image ? 'on' : ''}`}>
                        {slide.active && slide.image ? 'Active' : 'Off'}
                      </span>
                    </div>

                    <div className="hero-slot-thumb">
                      {slide.image ? (
                        <img src={slide.image} alt="" />
                      ) : (
                        <div className="hero-slot-thumb-empty">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>

                    {slide.title && <p className="hero-slot-title">{slide.title}</p>}

                    <div className="hero-slot-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditSlide(slide)}
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setRemoveSlideId(slide.id)}
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Home cards */}
          <div className="panel">
            <div className="hero-simple-section-head">
              <div>
                <h3 className="panel-title">Home cards</h3>
                <p>
                  Menu / Top Seller / Deals — {sideCards.length}/{MAX_SIDE_CARDS} cards
                </p>
              </div>
              <div className="hero-section-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={openAddCard}
                  disabled={sideCards.length >= MAX_SIDE_CARDS}
                >
                  <Plus size={14} />
                  Add card
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveCards}
                  disabled={savingCards}
                >
                  <Save size={14} />
                  {savingCards ? 'Saving…' : 'Save pictures'}
                </button>
              </div>
            </div>

            {sideCards.length === 0 ? (
              <div className="hero-empty-block">
                <p>No cards yet. Add a Menu, Top Seller, or Deals card.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={openAddCard}>
                  <Plus size={14} />
                  Add card
                </button>
              </div>
            ) : (
              <div className="hero-home-cards">
                {sideCards.map((card) => (
                  <div key={card.id} className="hero-home-card-edit">
                    <div className="hero-card-edit-head">
                      <h4>{card.title}</h4>
                    </div>
                    <div className="hero-slot-thumb hero-slot-thumb--card">
                      {card.image ? (
                        <img src={card.image} alt="" />
                      ) : (
                        <div className="hero-slot-thumb-empty">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                    <div className="hero-slot-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditCard(card)}
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setRemoveCardId(card.id)}
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide add/edit modal */}
      <Modal
        open={Boolean(slideModal)}
        onClose={() => setSlideModal(null)}
        title={slideModal?.mode === 'edit' ? 'Edit slide' : 'Add slide'}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setSlideModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={saveSlideModal}>
              {slideModal?.mode === 'edit' ? 'Update' : 'Add'}
            </button>
          </>
        }
      >
        <ImageUploadField
          label="Slide picture *"
          value={slideForm.image}
          onChange={(v) => setSlideForm((p) => ({ ...p, image: v }))}
          uploadFolder="hero"
        />
        <div className="form-group">
          <label htmlFor="slide-title">Title (optional)</label>
          <input
            id="slide-title"
            type="text"
            className="form-control"
            value={slideForm.title}
            onChange={(e) => setSlideForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Optional text on slide"
          />
        </div>
        <div className="toggle-row">
          <div>
            <strong>Active in rotation</strong>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={slideForm.active}
              onChange={(e) => setSlideForm((p) => ({ ...p, active: e.target.checked }))}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </Modal>

      {/* Card add/edit modal */}
      <Modal
        open={Boolean(cardModal)}
        onClose={() => setCardModal(null)}
        title={cardModal?.mode === 'edit' ? 'Edit card' : 'Add card'}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setCardModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={saveCardModal}>
              {cardModal?.mode === 'edit' ? 'Update' : 'Add'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="card-type">Card type</label>
          <select
            id="card-type"
            className="form-control"
            value={cardForm.key}
            disabled={cardModal?.mode === 'edit'}
            onChange={(e) => {
              const preset = SIDE_PRESETS.find((p) => p.key === e.target.value);
              setCardForm((p) => ({
                ...p,
                key: e.target.value,
                title: preset?.title ?? p.title,
                link: preset?.link ?? p.link,
              }));
            }}
          >
            {SIDE_PRESETS.map((p) => (
              <option
                key={p.key}
                value={p.key}
                disabled={
                  cardModal?.mode === 'add' &&
                  usedKeys.includes(p.key)
                }
              >
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="card-title">Title *</label>
          <input
            id="card-title"
            type="text"
            className="form-control"
            value={cardForm.title}
            onChange={(e) => setCardForm((p) => ({ ...p, title: e.target.value }))}
          />
        </div>
        <ImageUploadField
          label="Card picture *"
          value={cardForm.image}
          onChange={(v) => setCardForm((p) => ({ ...p, image: v }))}
          uploadFolder="hero"
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(removeSlideId)}
        title="Remove slide"
        message="This slide will be removed from the list. Click Save slides to confirm."
        confirmText="Remove"
        danger
        onConfirm={confirmRemoveSlide}
        onCancel={() => setRemoveSlideId(null)}
      />

      <ConfirmDialog
        open={Boolean(removeCardId)}
        title="Remove card"
        message="This home card will be removed. Click Save pictures to confirm."
        confirmText="Remove"
        danger
        onConfirm={confirmRemoveCard}
        onCancel={() => setRemoveCardId(null)}
      />
    </section>
  );
}
