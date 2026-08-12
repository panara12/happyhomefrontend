import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const USERS_QUERY_KEY = ["getAllUsers"];

// The backend paginates this endpoint server-side (default limit: 10). Since
// this list is searched/paginated client-side, request the backend's max
// page size so the full dataset is available locally instead of silently
// truncating to the first 10 users.
export function useGetAllUsers() {
    return useApiQuery({
        queryKey: USERS_QUERY_KEY,
        path: "/users/getallusers",
        params: { limit: 100 },
    });
}

export function useAddUser() {
    return useApiMutation({
        url: "/users/adduser",
        method: "post",
        invalidateKeys: [USERS_QUERY_KEY],
    });
}

export function useUpdateUser() {
    return useApiMutation({
        url: "/users/updateuser",
        method: "post",
        invalidateKeys: [USERS_QUERY_KEY],
    });
}

export function useDeleteUser() {
    return useApiMutation({
        url: "/users/deleteuser",
        method: "delete",
        invalidateKeys: [USERS_QUERY_KEY],
    });
}

export function useActiveUser() {
    return useApiMutation({
        url: "/users/activeuser",
        method: "post",
        invalidateKeys: [USERS_QUERY_KEY],
    });
}
