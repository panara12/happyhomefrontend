import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";
import { setUserInfo } from "../store/slice/appSlice";
import http from "../apiServices/http.service";

const CURRENT_USER_QUERY_KEY = ["currentUser"];

// Signs the user in, then redirects to their role's dashboard
export function useLogin() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useApiMutation({
        url: "/auth/login",
        method: "post",
        onSuccess: async (data) => {
            dispatch(setUserInfo(data.user));
            // Clear any cached failed /auth/me so ProtectedRoute does not bounce back to login
            await queryClient.resetQueries({ queryKey: CURRENT_USER_QUERY_KEY });
            navigate(`/${data.user.userType}/dashboard`, { replace: true });
        },
    });
}

export function useGetLoggedUser() {
    return useApiQuery({
        queryKey: CURRENT_USER_QUERY_KEY,
        path: "/auth/me",
        retry: false,
    });
}

export function useLogout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useApiMutation({
        // Backend logs out on a GET, not a real REST mutation verb — bypass url/method.
        mutationFn: () => http.get("/auth/logout"),
        showErrorToast: false,
        onSettled: async () => {
            dispatch(setUserInfo(null));
            await queryClient.resetQueries({ queryKey: CURRENT_USER_QUERY_KEY });
            navigate("/login", { replace: true });
        },
    });
}
