import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const STORES_QUERY_KEY = ["stores"];

export function useGetAllStores() {
    return useApiQuery({
        queryKey: STORES_QUERY_KEY,
        path: "/stores/getAllStores",
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
