import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const UNITS_QUERY_KEY = "units";

// The backend paginates this endpoint server-side (default limit: 10). Since
// this list is searched/paginated client-side, request the backend's max
// page size so the full dataset is available locally instead of silently
// truncating to the first 10 users.
export function useGetAllUnits() {
    return useApiQuery({
        queryKey: UNITS_QUERY_KEY,
        path: "/units/getAllUnits",
        params: { limit: 100 },
    });
}

export function useAddUser() {
    return useApiMutation({
        url: "/units/addunit",
        method: "post",
        invalidateKeys: [UNITS_QUERY_KEY],
    });
}

export function useUpdateUser() {
    return useApiMutation({
        url: (variable) => `/users/updateunit/${variable.id}`,
        method: "post",
        invalidateKeys: [UNITS_QUERY_KEY],
    });
}
