import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";
import http from "../apiServices/http.service";

const MY_INVOICES_KEY = ["my-invoices"];
export const STORE_INVOICES_KEY = ["store-invoices"];
const PRODUCTS_QUERY_KEY = ["products"];

export function useSubmitInvoice() {
  return useApiMutation({
    url: "/invoices/invoice-submit",
    method: "post",
    invalidateKeys: [MY_INVOICES_KEY, STORE_INVOICES_KEY, PRODUCTS_QUERY_KEY],
  });
}

// Own invoices only (backend filters by session createdBy)
export function useGetMyInvoices({ status, page = 1, limit = 200 } = {}) {
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
export function useGetStoreInvoices({
  status,
  q = "",
  fromDate = "",
  toDate = "",
  dateField = "createdAt",
  page = 1,
  limit = 100,
  fetchAll = false,
  enabled = true,
} = {}) {
  const filters = {
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
    ...(dateField ? { dateField } : {}),
  };

  return useApiQuery({
    queryKey: [...STORE_INVOICES_KEY, status || "all", q, fromDate, toDate, dateField, page, limit, fetchAll],
    path: "/invoices/store-invoices",
    params: { ...filters, page, limit },
    ...(fetchAll ? {
      queryFn: async () => {
        const firstPage = await http.get("/invoices/store-invoices", {
          params: { ...filters, page: 1, limit },
        });
        const invoices = [...(firstPage?.invoices || [])];
        const totalPages = Math.max(1, Number(firstPage?.pagination?.totalPages) || 1);

        for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
          const response = await http.get("/invoices/store-invoices", {
            params: { ...filters, page: currentPage, limit },
          });
          invoices.push(...(response?.invoices || []));
        }

        return { ...firstPage, invoices };
      },
    } : {}),
    enabled,
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
