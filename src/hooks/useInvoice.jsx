import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const MY_INVOICES_KEY = ["my-invoices"];
const STORE_INVOICES_KEY = ["store-invoices"];
const PRODUCTS_QUERY_KEY = ["products"];

export function useSubmitInvoice() {
  return useApiMutation({
    url: "/invoices/invoice-submit",
    method: "post",
    successMessage: "Invoice submitted successfully",
    invalidateKeys: [MY_INVOICES_KEY, STORE_INVOICES_KEY, PRODUCTS_QUERY_KEY],
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

// Store invoices for manager approval board
export function useGetStoreInvoices({ status, q = "", page = 1, limit = 100 } = {}) {
  return useApiQuery({
    queryKey: [...STORE_INVOICES_KEY, status || "all", q, page, limit],
    path: "/invoices/store-invoices",
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
    },
    keepPrevious: true,
  });
}

export function useUpdateInvoiceStatus() {
  return useApiMutation({
    url: (variables) => `/invoices/update-status/${variables.id}`,
    method: "put",
    invalidateKeys: [MY_INVOICES_KEY, STORE_INVOICES_KEY, PRODUCTS_QUERY_KEY],
  });
}

export function useUpdateInvoice() {
  return useApiMutation({
    url: (variables) => `/invoices/update/${variables.id}`,
    method: "put",
    invalidateKeys: [MY_INVOICES_KEY, STORE_INVOICES_KEY, PRODUCTS_QUERY_KEY],
    successMessage: "Invoice updated successfully",
  });
}
