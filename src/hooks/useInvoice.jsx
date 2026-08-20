import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const MY_INVOICES_KEY = ["my-invoices"];

export function useSubmitInvoice() {
  return useApiMutation({
    url: "/invoices/invoice-submit",
    method: "post",
    successMessage: "Invoice submitted successfully",
    invalidateKeys: [MY_INVOICES_KEY],
  });
}

// Own invoices only (backend filters by session createdBy)
export function useGetMyInvoices({ status, page = 1, limit = 100 } = {}) {
  return useApiQuery({
    queryKey: [...MY_INVOICES_KEY, status || "all", page, limit],
    path: "/invoices/my-invoices",
    params: {
      ...(status ? { status } : {}),
      page,
      limit,
    },
  });
}
