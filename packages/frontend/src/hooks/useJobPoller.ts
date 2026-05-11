import { useQuery } from '@tanstack/react-query';
import { getJobStatus } from '../services/api';
import type { JobResponse } from '../types/job.types';

export function useJobPoller(jobId: string | null) {
  return useQuery<JobResponse>({
    queryKey: ['job', jobId],
    queryFn: () => getJobStatus(jobId!),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'done' || status === 'failed') return false;
      return 1000;
    },
    staleTime: 0,
  });
}
