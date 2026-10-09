import { Platform } from 'react-native';

import { CreatePayosLinkResponse } from '@/types/payment';

export type VietQrBankApp = {
  appId: string;
  appName: string;
  bankName: string;
  appLogo: string;
  autofill: boolean;
  bin?: string;
};

type RawBankApp = {
  appId?: string;
  appName?: string;
  bankName?: string;
  appLogo?: string;
  autofill?: string | number | boolean;
  bin?: string;
};

// Different base URL from apiClient's backend, so this uses a plain fetch rather
// than the shared axios instance.
const ENDPOINT =
  Platform.OS === 'ios'
    ? 'https://api.vietqr.io/v2/ios-app-deeplinks'
    : 'https://api.vietqr.io/v2/android-app-deeplinks';

let cache: VietQrBankApp[] | null = null;
let inflight: Promise<VietQrBankApp[]> | null = null;

function normalize(raw: RawBankApp): VietQrBankApp | null {
  if (!raw.appId || !raw.appName || !raw.bankName || !raw.appLogo) return null;
  return {
    appId: raw.appId,
    appName: raw.appName,
    bankName: raw.bankName,
    appLogo: raw.appLogo,
    autofill: raw.autofill === 1 || raw.autofill === '1' || raw.autofill === true,
    bin: raw.bin,
  };
}

/** Fetches the VietQR bank-app deeplink list for the current platform, caching in memory. */
export async function fetchVietQrBankApps(): Promise<VietQrBankApp[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      const response = await fetch(ENDPOINT);
      if (!response.ok) throw new Error(`VietQR bank list request failed (${response.status})`);
      const json: { data?: RawBankApp[] } = await response.json();
      const apps = (json.data ?? []).map(normalize).filter((app): app is VietQrBankApp => app !== null);
      cache = apps;
      return apps;
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** Looks up a bank's display name by its VietQR `bin`, falling back to the bin itself. */
export function findBankNameByBin(apps: VietQrBankApp[], bin?: string | null): string | undefined {
  if (!bin) return undefined;
  return apps.find((app) => app.bin === bin)?.bankName ?? bin;
}

/** Builds a VietQR universal deeplink that opens a banking app with the transfer pre-filled. */
export function buildBankDeeplink(
  appId: string,
  link: Pick<CreatePayosLinkResponse, 'accountNumber' | 'bin' | 'amount' | 'description'>,
) {
  const parts = [`app=${appId}`];
  if (link.accountNumber && link.bin) parts.push(`ba=${link.accountNumber}@${link.bin}`);
  if (link.amount != null) parts.push(`am=${link.amount}`);
  if (link.description) parts.push(`tn=${encodeURIComponent(link.description)}`);
  return `https://dl.vietqr.io/pay?${parts.join('&')}`;
}
