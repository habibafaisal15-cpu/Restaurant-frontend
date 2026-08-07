import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './LocationMap.css';

const DEFAULT_CENTER = [31.5497, 74.3436];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function LocationMap({ lat, lng, onPick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const onPickRef = useRef(onPick);
  const hasInitialCoords =
    Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return undefined;

    const start = hasInitialCoords
      ? [Number(lat), Number(lng)]
      : DEFAULT_CENTER;
    const startZoom = hasInitialCoords ? 16 : 12;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(start, startZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    map.on('click', (event) => {
      onPickRef.current?.({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    });

    mapInstanceRef.current = map;

    if (hasInitialCoords) {
      markerRef.current = L.marker(start).addTo(map);
    }

    // Modal animation / late layout: refresh size a few times so the pin isn't offset.
    const timers = [50, 200, 450, 800].map((ms) =>
      window.setTimeout(() => {
        map.invalidateSize({ animate: false });
        if (hasInitialCoords) {
          map.setView(start, Math.max(map.getZoom(), 16), { animate: false });
        }
      }, ms),
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // Only mount once per modal open; lat/lng updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || lat == null || lng == null) return undefined;
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      return undefined;
    }

    const position = [Number(lat), Number(lng)];

    map.invalidateSize({ animate: false });

    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      markerRef.current = L.marker(position).addTo(map);
    }

    map.setView(position, Math.max(map.getZoom(), 16), { animate: true });

    const settle = window.setTimeout(() => {
      map.invalidateSize({ animate: false });
      map.setView(position, Math.max(map.getZoom(), 16), { animate: false });
    }, 300);

    return () => window.clearTimeout(settle);
  }, [lat, lng]);

  return (
    <div className="location-map">
      <div ref={mapRef} className="location-map__canvas" />
      <p className="location-map__hint">Tap on the map to drop your pin</p>
    </div>
  );
}

export default LocationMap;
