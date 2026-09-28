import { useCallback, useEffect, useEffectEvent, useState, type DependencyList } from 'react';

import { repository } from '@/data';
import type { ClinicalReview } from '@/domain/models';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Loads data from the repository and re-fetches whenever the repository
 * emits a change (e.g. a clinical review or a scan upload). Data is kept
 * while re-fetching the same query, so screens don't flash on updates.
 */
export function useRepoQuery<T>(fetcher: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const key = JSON.stringify(deps);
  const [state, setState] = useState<{ key?: string; data?: T; error: Error | null }>({ error: null });
  const [tick, setTick] = useState(0);
  const load = useEffectEvent(fetcher);

  useEffect(() => {
    let alive = true;
    load()
      .then((data) => alive && setState({ key, data, error: null }))
      .catch((e: unknown) => alive && setState((s) => ({ ...s, key, error: e instanceof Error ? e : new Error(String(e)) })));
    return () => {
      alive = false;
    };
  }, [key, tick]);

  useEffect(() => repository.subscribe(() => setTick((t) => t + 1)), []);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const current = state.key === key;
  return {
    data: current ? state.data : undefined,
    loading: !current,
    error: current ? state.error : null,
    reload,
  };
}

export const usePatients = () => useRepoQuery(() => repository.listPatients(), []);
export const usePatient = (id: string) => useRepoQuery(() => repository.getPatient(id), [id]);
export const useTooth = (patientId: string, tooth: string) =>
  useRepoQuery(() => repository.getTooth(patientId, tooth), [patientId, tooth]);
export const useClinicStats = () => useRepoQuery(() => repository.getClinicStats(), []);
export const useStaff = () => useRepoQuery(() => repository.listStaff(), []);
export const useRecentScans = () => useRepoQuery(() => repository.listRecentScans(), []);
export const useSampleScans = () => useRepoQuery(() => repository.listSampleScans(), []);
export const useReviews = () => useRepoQuery(() => repository.listReviews(), []);

export const useReview = (findingId: string | undefined) =>
  useRepoQuery<ClinicalReview | null>(
    () => (findingId ? repository.getReview(findingId) : Promise.resolve(null)),
    [findingId]
  );
