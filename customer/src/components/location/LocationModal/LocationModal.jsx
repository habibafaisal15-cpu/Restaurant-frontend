import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocationContext } from '../../../context';
import {
  DELIVERY_UNAVAILABLE_MESSAGE,
  DeliveryUnavailableError,
  reverseGeocode,
  validateAndAssignLocation,
  geocodeAddress,
} from '../../../services/locationService';
import LocationMap from '../LocationMap';
import './LocationModal.css';

function isBlockedDeliveryMessage(message = '') {
  const text = String(message).toLowerCase();
  return (
    text.includes("don't deliver") ||
    text.includes('do not deliver') ||
    text.includes('not deliver') ||
    text.includes('outside') ||
    text.includes('unavailable')
  );
}

function LocationModal() {
  const {
    isLocationModalOpen,
    dismissLocationModal,
    applyDeliverableLocation,
  } = useLocationContext();

  const [mode, setMode] = useState('map');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualAddress, setManualAddress] = useState('');
  const [mapEpoch, setMapEpoch] = useState(0);
  const [pin, setPin] = useState({
    lat: null,
    lng: null,
    address: '',
  });

  useEffect(() => {
    document.body.style.overflow = isLocationModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLocationModalOpen]);

  useEffect(() => {
    if (!isLocationModalOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismissLocationModal();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isLocationModalOpen, dismissLocationModal]);

  useEffect(() => {
    if (!isLocationModalOpen) {
      setLoading(false);
      setError(null);
    }
  }, [isLocationModalOpen]);

  if (!isLocationModalOpen) return null;

  const confirmLocation = async (coords) => {
    setLoading(true);
    setError(null);
    try {
      const result = await validateAndAssignLocation(coords);
      applyDeliverableLocation(result.location, result.branch);
    } catch (err) {
      const message =
        err instanceof DeliveryUnavailableError
          ? err.message || DELIVERY_UNAVAILABLE_MESSAGE
          : err.message || DELIVERY_UNAVAILABLE_MESSAGE;
      setError(message);
      setMode('map');
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextPin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: '',
        };

        setMode('map');
        setPin(nextPin);
        setMapEpoch((value) => value + 1);

        try {
          const address = await reverseGeocode(nextPin.lat, nextPin.lng);
          nextPin.address = address;
          setPin({ ...nextPin });
        } catch {
          nextPin.address = `${nextPin.lat.toFixed(5)}, ${nextPin.lng.toFixed(5)}`;
          setPin({ ...nextPin });
        }

        await confirmLocation(nextPin);
      },
      (geoError) => {
        setLoading(false);
        setMode('map');
        const denied = geoError?.code === 1;
        setError(
          denied
            ? 'Location permission denied. Allow location access or drop a pin on the map.'
            : 'Unable to detect location. Use map or enter address manually.',
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const handleMapPick = async ({ lat, lng }) => {
    setPin((current) => ({ ...current, lat, lng }));
    setError(null);
    try {
      const address = await reverseGeocode(lat, lng);
      setPin({ lat, lng, address });
    } catch {
      setPin({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    if (!manualAddress.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const found = await geocodeAddress(manualAddress.trim());
      setPin(found);
      setMode('map');
      await confirmLocation(found);
    } catch (err) {
      setError(
        err instanceof DeliveryUnavailableError
          ? err.message || DELIVERY_UNAVAILABLE_MESSAGE
          : err.message || DELIVERY_UNAVAILABLE_MESSAGE,
      );
      setLoading(false);
    }
  };

  const handleConfirmPin = async () => {
    if (pin.lat == null || pin.lng == null) {
      setError('Please drop a pin on the map first.');
      return;
    }
    await confirmLocation(pin);
  };

  return createPortal(
    <div
      className="location-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div className="location-modal__panel">
        <button
          type="button"
          className="location-modal__close"
          aria-label="Close location popup"
          onClick={dismissLocationModal}
        >
          ×
        </button>

        <div className="location-modal__head">
          <p className="location-modal__eyebrow">Delivery setup</p>
          <h2 id="location-modal-title">Choose your location</h2>
          <p>
            We check delivery coverage with the kitchen before setting your
            location.
          </p>
        </div>

        <div className="location-modal__modes" role="tablist">
          <button
            type="button"
            className={mode === 'map' ? 'is-active' : ''}
            onClick={() => setMode('map')}
          >
            Map
          </button>
          <button
            type="button"
            className={mode === 'manual' ? 'is-active' : ''}
            onClick={() => setMode('manual')}
          >
            Manual
          </button>
        </div>

        <button
          type="button"
          className="location-modal__gps"
          onClick={handleDetect}
          disabled={loading}
        >
          {loading ? 'Checking delivery...' : 'Use my current location'}
        </button>

        {mode === 'map' ? (
          <div className="location-modal__map-block">
            <LocationMap
              key={mapEpoch}
              lat={pin.lat}
              lng={pin.lng}
              onPick={handleMapPick}
            />
            {pin.address && (
              <p className="location-modal__selected">
                Selected: <strong>{pin.address}</strong>
              </p>
            )}
            <button
              type="button"
              className="location-modal__confirm"
              onClick={handleConfirmPin}
              disabled={loading || pin.lat == null}
            >
              {loading ? 'Checking delivery...' : 'Confirm this location'}
            </button>
          </div>
        ) : (
          <form className="location-modal__manual" onSubmit={handleManualSubmit}>
            <label htmlFor="manual-address">Enter address</label>
            <textarea
              id="manual-address"
              rows={3}
              value={manualAddress}
              onChange={(event) => setManualAddress(event.target.value)}
              placeholder="House, street, area, city"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Checking delivery...' : 'Find & continue'}
            </button>
          </form>
        )}

        {error && (
          <p
            className={
              isBlockedDeliveryMessage(error)
                ? 'location-modal__error location-modal__error--blocked'
                : 'location-modal__error'
            }
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default LocationModal;
