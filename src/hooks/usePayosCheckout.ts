import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { paymentsApi } from '@/api/payments';
import { CreatePayosLinkResponse } from '@/types/payment';

export type PayosCheckoutPhase = 'loading' | 'waiting' | 'paid' | 'expired' | 'failed' | 'error';

const POLL_INTERVAL_MS = 4000;

/**
 * Owns a PayOS checkout link's whole lifecycle for one booking: creating it, polling
 * for payment, expiring it client-side right when `expiredAt` passes, and pausing that
 * polling while the app is backgrounded (resyncing once immediately on foreground).
 */
export function usePayosCheckout(bookingId: string) {
  const [phase, setPhase] = useState<PayosCheckoutPhase>('loading');
  const [link, setLink] = useState<CreatePayosLinkResponse | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appIsActive, setAppIsActive] = useState(() => AppState.currentState === 'active');

  const createLink = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setLink(null);
    try {
      // TODO: confirm with backend whether POST /payments/payos/:bookingId/link is
      // idempotent — calling it again here (regenerate(), or simply remounting this
      // screen) for a booking that already has an active link should return that
      // same link rather than silently creating a second payment intent.
      const created = await paymentsApi.createPayosLink(bookingId);
      setLink(created);

      if (created.amount != null) {
        setAmount(created.amount);
        setPhase('waiting');
        return;
      }

      // No amount on the create response (e.g. an existing/reused link) — ask once
      // immediately instead of waiting out the first poll interval to show it.
      const booking = await paymentsApi.syncPayosStatus(bookingId);
      setAmount(booking.totalAmount);
      if (booking.paymentStatus === 'PAID') setPhase('paid');
      else if (booking.paymentStatus === 'FAILED') setPhase('failed');
      else setPhase('waiting');
    } catch (err) {
      setError(getApiErrorMessage(err));
      setPhase('error');
    }
  }, [bookingId]);

  useEffect(() => {
    async function run() {
      await createLink();
    }
    run();
  }, [createLink]);

  const sync = useCallback(async () => {
    try {
      const booking = await paymentsApi.syncPayosStatus(bookingId);
      setAmount(booking.totalAmount);
      if (booking.paymentStatus === 'PAID') setPhase('paid');
      else if (booking.paymentStatus === 'FAILED') setPhase('failed');
    } catch {
      // ignore transient polling errors — the next tick/foreground sync retries
    }
  }, [bookingId]);

  // Flips to expired right when the link's expiredAt (epoch seconds) passes, instead
  // of only noticing on the next 4s poll tick.
  useEffect(() => {
    if (phase !== 'waiting' || !link?.expiredAt) return;
    // Clamped to 0 (instead of branching on an already-past expiredAt) so this never
    // calls setState synchronously within the effect — setTimeout(fn, 0) still defers
    // to the next tick, which is all "already expired" needs anyway.
    const delay = Math.max(0, link.expiredAt * 1000 - Date.now());
    const id = setTimeout(() => setPhase('expired'), delay);
    return () => clearTimeout(id);
  }, [phase, link?.expiredAt]);

  // Poll only while there's actually something to wait for and the app is in front.
  useEffect(() => {
    if (phase !== 'waiting' || !appIsActive) return;
    const id = setInterval(sync, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase, appIsActive, sync]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const isActive = nextState === 'active';
      setAppIsActive(isActive);
      if (isActive) sync();
    });
    return () => subscription.remove();
  }, [sync]);

  return { phase, link, amount, error, regenerate: createLink };
}
