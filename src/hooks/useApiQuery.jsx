import { keepPreviousData, useQuery } from "@tanstack/react-query";
import http from "../apiServices/http.service";

/**
 * Standard GET hook built on top of http.service — one place to change
 * how every query fetches, caches, and polls.
 *
 * @param {object} options
 * @param {import("@tanstack/react-query").QueryKey} options.queryKey
 * @param {string} options.path
 * @param {Record<string, unknown>} [options.params]
 * @param {boolean} [options.enabled]
 * @param {boolean} [options.keepPrevious] Keep the prior page's data visible while the next request resolves
 * @param {number} [options.staleTime]
 * @param {number|false} [options.refetchInterval] Poll on an interval in milliseconds
 */
export function useApiQuery({
  queryKey,
  path,
  params,
  enabled,
  keepPrevious,
  staleTime,
  refetchInterval,
  ...queryOptions
}) {
  return useQuery({
    queryKey,
    queryFn: () => http.get(path, { params }),
    enabled,
    staleTime,
    refetchInterval,
    placeholderData: keepPrevious ? keepPreviousData : undefined,
    ...queryOptions,
  });
}
