import { ApiRepository } from './api/apiRepository';
import { MockRepository } from './mock/mockRepository';
import type { DentalRepository } from './repository';

/**
 * Single switch point between simulated and real data.
 *   EXPO_PUBLIC_DATA_SOURCE=api EXPO_PUBLIC_API_URL=https://... npx expo start
 */
function createRepository(): DentalRepository {
  const source = process.env.EXPO_PUBLIC_DATA_SOURCE;
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (source === 'api' && url) return new ApiRepository(url);
  return new MockRepository();
}

export const repository: DentalRepository = createRepository();
export type { DentalRepository } from './repository';
