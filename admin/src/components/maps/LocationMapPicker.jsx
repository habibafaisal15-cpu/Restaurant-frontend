import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './LocationMapPicker.css';

// Fix default marker icons under Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [24.8607, 67.0011]; // Karachi

function copperColor() {
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--copper').trim() ||
    '#7b1e3a'
  );
}

/**
 * Interactive map: click/drag pin; circle shows delivery radius (km).
 * When lat/lng/radius change from the form (e.g. typed address), the pin and circle update.
 */
export default function LocationMapPicker({
  latitude,
  longitude,
  radiusKm = 10,
  onChange,
  height = 280,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const hasCoords =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      (latitude !== 0 || longitude !== 0);
    const center = hasCoords ? [latitude, longitude] : DEFAULT_CENTER;

    const map = L.map(containerRef.current, {
      center,
      zoom: hasCoords ? 12 : 11,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e) => {
      onChangeRef.current?.({
        latitude: Number(e.latlng.lat.toFixed(6)),
        longitude: Number(e.latlng.lng.toFixed(6)),
        source: 'map',
      });
    });

    mapRef.current = map;

    requestAnimationFrame(() => {
      map.invalidateSize();
    });
    const t = window.setTimeout(() => map.invalidateSize(), 280);

    return () => {
      window.clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const lat = Number(latitude);
    const lng = Number(longitude);
    const radiusMeters = Math.max(0.5, Number(radiusKm) || 10) * 1000;
    const color = copperColor();

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onChangeRef.current?.({
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6)),
          source: 'map',
        });
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (!circleRef.current) {
      circleRef.current = L.circle([lat, lng], {
        radius: radiusMeters,
        color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
    } else {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radiusMeters);
    }

    try {
      const bounds = circleRef.current.getBounds();
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15, animate: true });
    } catch {
      map.panTo([lat, lng]);
    }

    window.setTimeout(() => map.invalidateSize(), 50);
  }, [latitude, longitude, radiusKm]);

  return (
    <div className="location-map-picker">
      <div
        ref={containerRef}
        className="location-map-picker__canvas"
        style={{ height }}
        role="presentation"
      />
      <p className="location-map-picker__hint">
        Type an address above to place the pin automatically, or click/drag the marker.
        The circle is the delivery coverage radius (km) used for customer orders.
      </p>
    </div>
  );
}
