import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const STORES_QUERY_KEY = ["stores"];

// The backend paginates this endpoint server-side (default limit: 10). Since
// this list is searched/paginated client-side, request the backend's max
// page size so the full dataset is available locally instead of silently
// truncating to the first 10 stores.
export function useGetAllStores() {
    return useApiQuery({
        queryKey: STORES_QUERY_KEY,
        path: "/stores/getAllStores",
        params: { limit: 100 },
    });
}

export function useAddStore() {
    return useApiMutation({
        url: "/stores/addstore",
        method: "post",
        invalidateKeys: [STORES_QUERY_KEY],
    });
}

export function useUpdateStore() {
    return useApiMutation({
        url: "/stores/updatestore",
        method: "post",
        invalidateKeys: [STORES_QUERY_KEY],
    });
}
