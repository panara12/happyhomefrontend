import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

const USERS_QUERY_KEY = ["getAllUsers"];

export function useGetAllUsers() {
    return useApiQuery({
        queryKey: USERS_QUERY_KEY,
        path: "/users/getallusers",
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
