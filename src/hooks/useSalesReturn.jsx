import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const SALES_RETURNS_QUERY_KEY = ["sales-returns"];

export function useGetSalesReturns({ q = "", status, page = 1, limit = 100 } = {}) {
  return useApiQuery({
    queryKey: [...SALES_RETURNS_QUERY_KEY, status || "all", q, page, limit],
    path: "/sales-returns/getAll",
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
    },
    keepPrevious: true,
  });
}

export function useCreateSalesReturn() {
  return useApiMutation({
    url: "/sales-returns/create",
    method: "post",
    invalidateKeys: [SALES_RETURNS_QUERY_KEY],
    successMessage: "Sales return created successfully",
  });
}

export function useUpdateSalesReturnStatus() {
  return useApiMutation({
    url: (variables) => `/sales-returns/update-status/${variables.id}`,
    method: "put",
    invalidateKeys: [SALES_RETURNS_QUERY_KEY, ["products"]],
  });
}
