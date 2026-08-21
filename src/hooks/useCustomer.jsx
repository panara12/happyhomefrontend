import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const CUSTOMERS_QUERY_KEY = ["customers"];

export function useSearchCustomers(query) {
    return useApiQuery({
        queryKey: [...CUSTOMERS_QUERY_KEY, "search", query],
        path: "/customers/search",
        params: { q: query },
        enabled: !!query && query.length > 0,
    });
}

export function useGetAllCustomers({ q = "", clientType = "All", page = 1, limit = 100 } = {}) {
    return useApiQuery({
        queryKey: [...CUSTOMERS_QUERY_KEY, "list", q, clientType, page, limit],
        path: "/customers/getAll",
        params: {
            page,
            limit,
            ...(q ? { q } : {}),
            ...(clientType && clientType !== "All" ? { clientType } : {}),
        },
        keepPrevious: true,
    });
}

export function useAddCustomer() {
    return useApiMutation({
        url: "/customers/add",
        method: "post",
        invalidateKeys: [CUSTOMERS_QUERY_KEY],
        successMessage: "Customer created successfully",
    });
}

export function useUpdateCustomer() {
    return useApiMutation({
        url: (variables) => `/customers/update/${variables._id}`,
        method: "put",
        invalidateKeys: [CUSTOMERS_QUERY_KEY],
        successMessage: "Customer updated successfully",
    });
}

export function useDeleteCustomer() {
    return useApiMutation({
        url: (variables) => `/customers/delete/${variables}`,
        method: "delete",
        invalidateKeys: [CUSTOMERS_QUERY_KEY],
        successMessage: "Customer deleted successfully",
    });
}
