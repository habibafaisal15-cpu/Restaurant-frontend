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

/**
 * Interactive map: click to place pin, circle shows delivery radius (km).
 * Customer maps will use the same lat/lng + radiusKm values.
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

    const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0);
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
      });
    });

    mapRef.current = map;

    // Modal / delayed layout: ensure tiles render at full size
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
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const lat = Number(latitude);
    const lng = Number(longitude);
    const radius = Math.max(0.5, Number(radiusKm) || 10) * 1000;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onChangeRef.current?.({
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6)),
        });
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (!circleRef.current) {
      circleRef.current = L.circle([lat, lng], {
        radius,
        color: getComputedStyle(document.documentElement).getPropertyValue('--copper').trim() || '#7b1e3a',
        fillColor: getComputedStyle(document.documentElement).getPropertyValue('--copper').trim() || '#7b1e3a',
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map);
    } else {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radius);
    }

    map.panTo([lat, lng]);
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
        Click the map to set the pin, or drag the marker. The circle is the delivery radius
        customers will see on their map.
      </p>
    </div>
  );
}
