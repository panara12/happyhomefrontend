import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const TRANSFERS_QUERY_KEY = ["transfers"];

export function useGetTransfers({ q = "", status, page = 1, limit = 100 } = {}) {
  return useApiQuery({
    queryKey: [...TRANSFERS_QUERY_KEY, status || "all", q, page, limit],
    path: "/transfers/getAll",
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
    },
    keepPrevious: true,
  });
}

export function useCreateTransfer() {
  return useApiMutation({
    url: "/transfers/create",
    method: "post",
    invalidateKeys: [TRANSFERS_QUERY_KEY, ["products"]],
    successMessage: "Transfer request created successfully",
  });
}

export function useUpdateTransferStatus() {
  return useApiMutation({
    url: (variables) => `/transfers/update-status/${variables.id}`,
    method: "put",
    invalidateKeys: [TRANSFERS_QUERY_KEY, ["products"]],
  });
}
