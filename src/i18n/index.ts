import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { useSettingsStore } from '@/store/settingsStore';
import { setDateLocale } from '@/utils/date';
import en from './locales/en.json';
import vi from './locales/vi.json';

i18next.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: useSettingsStore.getState().language,
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
});

setDateLocale(useSettingsStore.getState().language);

// Keep i18next (and dayjs's weekday/month names) in sync with the persisted
// setting — covers both hydration (the store starts at the 'vi' default and
// updates once storage loads) and the language switcher in Tài khoản.
useSettingsStore.subscribe((state, prevState) => {
  if (state.language !== prevState.language) {
    i18next.changeLanguage(state.language);
    setDateLocale(state.language);
  }
});

export default i18next;
