import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MapPin,
  Power,
  Navigation,
  CircleDot,
  LocateFixed,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import LocationMapPicker from '../components/maps/LocationMapPicker';
import * as locationService from '../services/locationService';
import { DEFAULT_RADIUS_KM } from '../services/locationService';
import './DeliveryLocations.css';

const EMPTY_FORM = {
  name: '',
  address: '',
  latitude: 24.8607,
  longitude: 67.0011,
  radiusKm: DEFAULT_RADIUS_KM,
  active: true,
  notes: '',
};

export default function DeliveryLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmMode, setConfirmMode] = useState('toggle'); // toggle | delete
  const [geocoding, setGeocoding] = useState(false);
  const skipNextAddressGeocode = useRef(false);
  const geocodeRequestId = useRef(0);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await locationService.getAll();
      setLocations(data);
    } catch {
      toast.error('Failed to load delivery locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const filtered = useMemo(() => {
    let list = [...locations];
    if (activeFilter === 'active') list = list.filter((l) => l.active);
    if (activeFilter === 'inactive') list = list.filter((l) => !l.active);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          l.notes?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [locations, search, activeFilter]);

  const stats = useMemo(
    () => ({
      total: locations.length,
      active: locations.filter((l) => l.active).length,
      avgRadius:
        locations.length === 0
          ? DEFAULT_RADIUS_KM
          : Math.round(
              (locations.reduce((s, l) => s + (l.radiusKm || DEFAULT_RADIUS_KM), 0) /
                locations.length) *
                10,
            ) / 10,
    }),
    [locations],
  );

  const applyGeocodeResult = useCallback((result, { updateAddress = true } = {}) => {
    if (updateAddress) {
      skipNextAddressGeocode.current = true;
    }
    setForm((prev) => ({
      ...prev,
      ...(updateAddress && result.address ? { address: result.address } : {}),
      latitude: Number(result.latitude.toFixed(6)),
      longitude: Number(result.longitude.toFixed(6)),
    }));
  }, []);

  const findAddressOnMap = useCallback(
    async (addressOverride) => {
      const query = String(addressOverride ?? form.address).trim();
      if (query.length < 3) {
        toast.error('Enter a fuller address to place it on the map');
        return;
      }

      const requestId = ++geocodeRequestId.current;
      setGeocoding(true);
      try {
        const result = await locationService.geocodeAddress(query);
        if (requestId !== geocodeRequestId.current) return;
        applyGeocodeResult(result, { updateAddress: true });
        toast.success('Location selected on map');
      } catch (err) {
        if (requestId !== geocodeRequestId.current) return;
        toast.error(err.message || 'Could not find that address on the map');
      } finally {
        if (requestId === geocodeRequestId.current) {
          setGeocoding(false);
        }
      }
    },
    [applyGeocodeResult, form.address],
  );

  useEffect(() => {
    if (!modalOpen) return undefined;
    if (skipNextAddressGeocode.current) {
      skipNextAddressGeocode.current = false;
      return undefined;
    }

    const query = form.address.trim();
    if (query.length < 5) return undefined;

    const timer = window.setTimeout(() => {
      findAddressOnMap(query);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [form.address, modalOpen, findAddressOnMap]);

  const handleMapChange = async ({ latitude, longitude, source }) => {
    setForm((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));

    if (source !== 'map') return;

    try {
      const result = await locationService.reverseGeocode(latitude, longitude);
      applyGeocodeResult(result, { updateAddress: true });
    } catch {
      // Keep pin even if reverse lookup fails
    }
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    skipNextAddressGeocode.current = true;
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    skipNextAddressGeocode.current = true;
    setForm({
      name: row.name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      radiusKm: row.radiusKm ?? DEFAULT_RADIUS_KM,
      active: row.active !== false,
      notes: row.notes || '',
    });
    setModalOpen(true);
  };

  const validate = () => {
    if (!form.name.trim()) {
      toast.error('Location name is required');
      return false;
    }
    if (!form.address.trim()) {
      toast.error('Address is required');
      return false;
    }
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      toast.error('Enter a valid latitude (-90 to 90)');
      return false;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      toast.error('Enter a valid longitude (-180 to 180)');
      return false;
    }
    const radius = Number(form.radiusKm);
    if (!Number.isFinite(radius) || radius < 0.5 || radius > 50) {
      toast.error('Radius must be between 0.5 and 50 km');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radiusKm: Number(form.radiusKm) || DEFAULT_RADIUS_KM,
        active: form.active !== false,
        notes: form.notes.trim(),
      };
      if (editingId) {
        await locationService.update(editingId, payload);
        toast.success('Delivery location updated — changes apply on the customer map');
      } else {
        await locationService.create(payload);
        toast.success('Delivery location added — visible for customer map coverage');
      }
      setModalOpen(false);
      await loadLocations();
    } catch (err) {
      toast.error(err.message ?? 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const askToggle = (row) => {
    setConfirmMode('toggle');
    setConfirmTarget(row);
    setConfirmOpen(true);
  };

  const askDelete = (row) => {
    setConfirmMode('delete');
    setConfirmTarget(row);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    try {
      if (confirmMode === 'delete') {
        await locationService.remove(confirmTarget.id);
        toast.success('Location removed');
      } else {
        const updated = await locationService.toggleActive(confirmTarget.id);
        toast.success(
          updated.active
            ? 'Location activated for customer deliveries'
            : 'Location deactivated — customers will not use this hub',
        );
      }
      setConfirmOpen(false);
      setConfirmTarget(null);
      await loadLocations();
    } catch (err) {
      toast.error(err.message ?? 'Action failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Location',
      render: (_, row) => (
        <div className="loc-name-cell">
          <span className="loc-name">{row.name}</span>
          <span className="loc-address">{row.address}</span>
        </div>
      ),
    },
    {
      key: 'coords',
      label: 'Coordinates',
      render: (_, row) => (
        <span className="loc-coords">
          {Number(row.latitude).toFixed(4)}, {Number(row.longitude).toFixed(4)}
        </span>
      ),
    },
    {
      key: 'radiusKm',
      label: 'Radius',
      render: (_, row) => (
        <span className="loc-radius-badge">
          <CircleDot size={12} />
          {row.radiusKm ?? DEFAULT_RADIUS_KM} km
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (_, row) => (
        <span
          className={`badge status-badge status-badge--${row.active ? 'success' : 'default'}`}
        >
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="loc-actions">
          <button
            type="button"
            className="btn-icon"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="btn-icon"
            title={row.active ? 'Deactivate' : 'Activate'}
            onClick={(e) => {
              e.stopPropagation();
              askToggle(row);
            }}
          >
            <Power size={16} />
          </button>
          <button
            type="button"
            className="btn-icon loc-actions-danger"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              askDelete(row);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page delivery-locations-page">
      <div className="page-header">
        <div>
          <h1>Delivery Locations</h1>
          <p>
            Set delivery hubs on the map. Each location covers a radius (default 10 km) that
            applies on the customer map for order placement.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add Location
        </button>
      </div>

      <div className="loc-stats grid-3 animate-slide-up">
        <div className="panel loc-stat">
          <MapPin size={18} />
          <div>
            <strong>{stats.total}</strong>
            <span>Total hubs</span>
          </div>
        </div>
        <div className="panel loc-stat">
          <Navigation size={18} />
          <div>
            <strong>{stats.active}</strong>
            <span>Active for customers</span>
          </div>
        </div>
        <div className="panel loc-stat">
          <CircleDot size={18} />
          <div>
            <strong>{stats.avgRadius} km</strong>
            <span>Average radius</span>
          </div>
        </div>
      </div>

      <div className="filters-bar animate-slide-up">
        <div className="search-input">
          <Search size={16} />
          <input
            type="search"
            className="form-control"
            placeholder="Search by name or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'inactive', label: 'Inactive' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tab ${activeFilter === t.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No delivery locations"
          description="Add a hub with a map pin and radius so customers can place orders within coverage."
          action={
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Location
            </button>
          }
        />
      ) : (
        <div className="panel animate-slide-up">
          <DataTable columns={columns} data={filtered} loading={loading} />
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingId ? 'Edit delivery location' : 'Add delivery location'}
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add location'}
            </button>
          </>
        }
      >
        <div className="loc-form">
          <div className="form-group">
            <label htmlFor="loc-name">Location name *</label>
            <input
              id="loc-name"
              className="form-control"
              placeholder="e.g. Clifton Hub"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="loc-address">Address *</label>
            <div className="loc-address-row">
              <input
                id="loc-address"
                className="form-control"
                placeholder="Street, area, city — map pin updates automatically"
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    findAddressOnMap();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={geocoding || !form.address.trim()}
                onClick={() => findAddressOnMap()}
              >
                <LocateFixed size={16} />
                {geocoding ? 'Finding…' : 'Find on map'}
              </button>
            </div>
            <p className="form-hint">
              Enter an address and click Find on map. The pin and coverage circle move to that
              place.
            </p>
          </div>

          <div className="form-group">
            <label>Map pin &amp; coverage</label>
            {modalOpen && (
              <LocationMapPicker
                key={editingId || 'new'}
                latitude={Number(form.latitude)}
                longitude={Number(form.longitude)}
                radiusKm={Number(form.radiusKm) || DEFAULT_RADIUS_KM}
                onChange={handleMapChange}
                height={320}
              />
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="loc-lat">Latitude *</label>
              <input
                id="loc-lat"
                type="number"
                step="0.000001"
                className="form-control"
                value={form.latitude}
                onChange={(e) => updateForm('latitude', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="loc-lng">Longitude *</label>
              <input
                id="loc-lng"
                type="number"
                step="0.000001"
                className="form-control"
                value={form.longitude}
                onChange={(e) => updateForm('longitude', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="loc-radius">Delivery radius (km) *</label>
              <input
                id="loc-radius"
                type="number"
                min="0.5"
                max="50"
                step="0.5"
                className="form-control"
                value={form.radiusKm}
                onChange={(e) => updateForm('radiusKm', e.target.value)}
              />
              <p className="form-hint">
                Customers outside this circle see &ldquo;Sorry, we don&apos;t deliver here.&rdquo;
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="loc-notes">Notes (optional)</label>
            <textarea
              id="loc-notes"
              className="form-control"
              rows={2}
              placeholder="Internal note for kitchen / ops"
              value={form.notes}
              onChange={(e) => updateForm('notes', e.target.value)}
            />
          </div>

          <div className="toggle-row">
            <div>
              <strong>Active for customers</strong>
              <p className="form-hint">Inactive hubs are hidden from the customer map.</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateForm('active', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={handleConfirm}
        title={confirmMode === 'delete' ? 'Delete location?' : 'Change location status?'}
        message={
          confirmMode === 'delete'
            ? `“${confirmTarget?.name}” will be removed. Customer maps will stop using this hub.`
            : confirmTarget?.active
              ? `Deactivate “${confirmTarget?.name}”? Customers will no longer see this delivery coverage.`
              : `Activate “${confirmTarget?.name}”? It will appear on the customer map with its radius.`
        }
        confirmText={confirmMode === 'delete' ? 'Delete' : 'Confirm'}
        danger={confirmMode === 'delete'}
      />
    </div>
  );
}
