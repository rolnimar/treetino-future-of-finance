import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { victronDemosResponseSchema } from './victron-types';
export function useEnrichedCampaigns() {
  const query = useQuery({
    queryKey: ['device-catalog'],
    queryFn: ({ signal }) =>
      api('devices', victronDemosResponseSchema, { signal }),
    refetchInterval: 5000,
  });
  const priority: Record<string, number> = {
    ess: 1,
    'treetino-v1': 2,
    ev: 3,
    offgrid: 4,
  };
  return {
    demos: [...(query.data?.demos ?? [])].sort(
      (a, b) => (priority[a.key] ?? 99) - (priority[b.key] ?? 99),
    ),
    isPending: query.isPending,
    isLoading: query.isLoading,
    error: query.error,
    updatedAt: query.data?.updatedAt ?? new Date().toISOString(),
    refetch: query.refetch,
  };
}
