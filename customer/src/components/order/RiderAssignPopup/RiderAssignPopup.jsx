import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getOrderById } from '../../../api/orders';
import { joinOrderTracking, onOrderUpdated } from '../../../api/socket';
import { formatPhone } from '../../../utils/format';
import './RiderAssignPopup.css';

const POLL_MS = 5000;
const SOCKET_DEBOUNCE_MS = 400;

function RiderAssignPopup({
  open = false,
  orderId,
  rider: incomingRider = null,
  onClose,
  onRiderReady,
}) {
  const [phase, setPhase] = useState('waiting');
  const [rider, setRider] = useState(incomingRider);
  const [orderNumber, setOrderNumber] = useState(null);
  const onRiderReadyRef = useRef(onRiderReady);
  const assignedRef = useRef(false);
  const trackingKeyRef = useRef(null);
  const socketTimerRef = useRef(null);

  useEffect(() => {
    onRiderReadyRef.current = onRiderReady;
  }, [onRiderReady]);

  useEffect(() => {
    if (!open) {
      assignedRef.current = false;
      trackingKeyRef.current = null;
      setPhase('waiting');
      setRider(null);
      setOrderNumber(null);
      return undefined;
    }

    if (trackingKeyRef.current !== orderId) {
      trackingKeyRef.current = orderId;
      assignedRef.current = Boolean(incomingRider);

      if (incomingRider) {
        setPhase('assigned');
        setRider(incomingRider);
      } else {
        setPhase('waiting');
        setRider(null);
        setOrderNumber(null);
      }
      return undefined;
    }

    if (incomingRider) {
      assignedRef.current = true;
      setPhase('assigned');
      setRider(incomingRider);
    }
  }, [open, orderId, incomingRider]);

  useEffect(() => {
    if (!open || !orderId || incomingRider) return undefined;

    let active = true;

    const applyRider = (nextRider, nextOrderNumber) => {
      if (!nextRider || !active || assignedRef.current) return;
      assignedRef.current = true;
      setRider(nextRider);
      setPhase('assigned');
      if (nextOrderNumber) setOrderNumber(nextOrderNumber);
      onRiderReadyRef.current?.(nextRider);
    };

    const fetchRider = async () => {
      if (assignedRef.current) return;

      try {
        const response = await getOrderById(orderId);
        const order = response?.data || response;
        if (!active || assignedRef.current) return;

        if (order?.orderNumber) setOrderNumber(order.orderNumber);

        if (order?.rider) {
          applyRider(order.rider, order.orderNumber);
        }
      } catch {
        // Keep waiting until admin assigns a rider
      }
    };

    const scheduleFetch = () => {
      if (assignedRef.current) return;
      window.clearTimeout(socketTimerRef.current);
      socketTimerRef.current = window.setTimeout(() => {
        if (active) fetchRider();
      }, SOCKET_DEBOUNCE_MS);
    };

    joinOrderTracking(orderId);
    fetchRider();
    const pollId = window.setInterval(fetchRider, POLL_MS);
    const unsubscribe = onOrderUpdated(scheduleFetch);

    return () => {
      active = false;
      window.clearInterval(pollId);
      window.clearTimeout(socketTimerRef.current);
      unsubscribe();
    };
  }, [open, orderId, incomingRider]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const displayId = orderNumber || orderId;

  return createPortal(
    <div
      className="rider-assign-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rider-assign-title"
    >
      <div className="rider-assign-popup__panel">
        <button
          type="button"
          className="rider-assign-popup__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="rider-assign-popup__map" aria-hidden="true">
          <div className="rider-assign-popup__pulse" />
          <div className="rider-assign-popup__pin">
            {phase === 'waiting' ? '…' : 'R'}
          </div>
          <p className="rider-assign-popup__map-label">
            {phase === 'waiting' ? 'Waiting for rider assignment' : 'Rider on the way'}
          </p>
        </div>

        {phase === 'waiting' ? (
          <div className="rider-assign-popup__body">
            <p className="rider-assign-popup__eyebrow">Order {displayId}</p>
            <h2 id="rider-assign-title">Your food is preparing</h2>
            <p className="rider-assign-popup__lead">
              The restaurant is preparing your order. Rider details will appear
              here as soon as admin assigns one.
            </p>
            <div className="rider-assign-popup__status" aria-live="polite">
              <span className="rider-assign-popup__spinner" />
              Waiting for rider assignment…
            </div>
          </div>
        ) : (
          <div className="rider-assign-popup__body">
            <p className="rider-assign-popup__eyebrow">Rider assigned</p>
            <h2 id="rider-assign-title">Your rider is on the way</h2>
            <p className="rider-assign-popup__lead">
              Kitchen is preparing your order. You can contact your rider below.
            </p>

            <div className="rider-assign-popup__rider">
              <div className="rider-assign-popup__avatar" aria-hidden="true">
                {(rider?.name || 'R').charAt(0)}
              </div>
              <div>
                <p className="rider-assign-popup__name">{rider?.name}</p>
                <a
                  className="rider-assign-popup__phone"
                  href={`tel:${rider?.phone}`}
                >
                  {formatPhone(rider?.phone)}
                </a>
              </div>
            </div>

            <button
              type="button"
              className="rider-assign-popup__done"
              onClick={onClose}
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default RiderAssignPopup;
