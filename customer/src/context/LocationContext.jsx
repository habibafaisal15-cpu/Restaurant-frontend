import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { STORAGE_KEYS } from '../constants';
import { isUuid } from '../api/adapters';
import { getItem, removeItem, setItem } from '../utils/storage';

const LocationContext = createContext(null);

function isValidLocation(value) {
  return Boolean(
    value &&
      (value.address || (value.lat != null && value.lng != null))
  );
}

function isValidBranch(value) {
  return Boolean(value?.id && isUuid(value.id));
}

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() =>
    getItem(STORAGE_KEYS.LOCATION)
  );
  const [branch, setBranchState] = useState(() => {
    const saved = getItem(STORAGE_KEYS.BRANCH);
    return isValidBranch(saved) ? saved : null;
  });
  const [dismissed, setDismissed] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);

  // Fresh load: only auto-open map popup when no valid location is saved
  useEffect(() => {
    sessionStorage.removeItem(STORAGE_KEYS.LOCATION_PROMPT_DISMISSED);

    const saved = getItem(STORAGE_KEYS.LOCATION);
    const savedBranch = getItem(STORAGE_KEYS.BRANCH);
    if (!isValidLocation(saved) || !isValidBranch(savedBranch)) {
      removeItem(STORAGE_KEYS.LOCATION);
      removeItem(STORAGE_KEYS.BRANCH);
      localStorage.removeItem(STORAGE_KEYS.BRANCH_ID);
      setLocationState(null);
      setBranchState(null);
      setDismissed(false);
      setForceOpen(true);
    }
  }, []);

  const setLocation = useCallback((nextLocation) => {
    setLocationState(nextLocation);
    setItem(STORAGE_KEYS.LOCATION, nextLocation);
  }, []);

  const setBranch = useCallback((nextBranch) => {
    setBranchState(nextBranch);
    setItem(STORAGE_KEYS.BRANCH, nextBranch);
    if (nextBranch?.id) {
      localStorage.setItem(STORAGE_KEYS.BRANCH_ID, String(nextBranch.id));
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    setBranchState(null);
    removeItem(STORAGE_KEYS.LOCATION);
    removeItem(STORAGE_KEYS.BRANCH);
    localStorage.removeItem(STORAGE_KEYS.BRANCH_ID);
    setDismissed(false);
    setForceOpen(true);
  }, []);

  const dismissLocationModal = useCallback(() => {
    setForceOpen(false);
    setDismissed(true);
  }, []);

  const openLocationModal = useCallback(() => {
    setDismissed(false);
    setForceOpen(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setForceOpen(false);
  }, []);

  const applyDeliverableLocation = useCallback((nextLocation, nextBranch) => {
    setLocationState(nextLocation);
    setItem(STORAGE_KEYS.LOCATION, nextLocation);
    setBranchState(nextBranch);
    setItem(STORAGE_KEYS.BRANCH, nextBranch);
    if (nextBranch?.id) {
      localStorage.setItem(STORAGE_KEYS.BRANCH_ID, String(nextBranch.id));
    }
    setForceOpen(false);
    setDismissed(true);
  }, []);

  const hasLocation = isValidLocation(location);
  const isLocationModalOpen = forceOpen || (!hasLocation && !dismissed);

  const value = useMemo(
    () => ({
      location,
      branch,
      setLocation,
      setBranch,
      clearLocation,
      hasLocation,
      isLocationModalOpen,
      openLocationModal,
      closeLocationModal,
      dismissLocationModal,
      applyDeliverableLocation,
    }),
    [
      location,
      branch,
      setLocation,
      setBranch,
      clearLocation,
      hasLocation,
      isLocationModalOpen,
      openLocationModal,
      closeLocationModal,
      dismissLocationModal,
      applyDeliverableLocation,
    ]
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return context;
}
