import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const SUPPLIERS_QUERY_KEY = ["suppliers"];

export function useSearchSuppliers(query) {
  return useApiQuery({
    queryKey: [...SUPPLIERS_QUERY_KEY, query],
    path: "/suppliers/getAll",
    params: { q: query },
    enabled: Boolean(query?.trim()),
    staleTime: 30_000,
  });
}

export function useAddSupplier() {
  return useApiMutation({
    url: "/suppliers/add",
    method: "post",
    invalidateKeys: [SUPPLIERS_QUERY_KEY],
    showErrorToast: false,
  });
}