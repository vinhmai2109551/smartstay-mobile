import { create } from 'zustand';

type SearchPrefs = {
  // ISO dates (YYYY-MM-DD), same format toIsoDate() produces — null until the
  // guest has run a search at least once this session.
  checkIn: string | null;
  checkOut: string | null;
  guests: number | null;
  setSearchPrefs: (prefs: { checkIn: string; checkOut: string; guests: number }) => void;
};

/**
 * Remembers the guest's last room search (dates + guest count) for this app session only
 * — not persisted to storage. Lets the home screen's search card show what was actually
 * searched instead of a static placeholder, and the search tab reopen where they left off.
 */
export const useSearchPrefsStore = create<SearchPrefs>()((set) => ({
  checkIn: null,
  checkOut: null,
  guests: null,
  setSearchPrefs: (prefs) => set(prefs),
}));
