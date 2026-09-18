import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export const LEADS_QUERY_KEY = ["leads"];

export function useGetAllLeads({ page = 1, limit = 100, q = "", enabled = true } = {}) {
  return useApiQuery({
    queryKey: [...LEADS_QUERY_KEY, page, limit, q],
    path: "/leads/getall",
    params: {
      page,
      limit,
      ...(q ? { q } : {}),
    },
    enabled,
    keepPrevious: true,
  });
}

export function useAddLead() {
  return useApiMutation({
    url: "/leads/add",
    method: "post",
    invalidateKeys: [LEADS_QUERY_KEY],
    successMessage: "Lead created successfully",
  });
}

export function useUpdateLead() {
  return useApiMutation({
    url: (variables) => `/leads/update/${variables._id}`,
    method: "put",
    invalidateKeys: [LEADS_QUERY_KEY],
    successMessage: "Lead updated successfully",
  });
}
