import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const KEY = ["distributer-returns"];

export function useSearchPurchaseBills(q, storeId) {
  return useApiQuery({
    queryKey: [...KEY, "bill-search", q, storeId],
    path: "/distributer-returns/bills/search",
    params: { q, ...(storeId ? { storeId } : {}) },
    enabled: q.trim().length > 0,
  });
}

export function useGetDistributerReturns() {
  return useApiQuery({ queryKey: KEY, path: "/distributer-returns/getAll", params: { limit: 100 } });
}

export function useCreateDistributerReturn() {
  return useApiMutation({
    url: "/distributer-returns/create",
    method: "post",
    invalidateKeys: [KEY, ["products"], ["purchase-bills"]],
    successMessage: "Distributor return created successfully",
  });
}
