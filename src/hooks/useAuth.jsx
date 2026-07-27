import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authApiService from '../apiServices/authApi';
import { useDispatch } from 'react-redux';
import { setUserInfo } from '../store/slice/appSlice';

// A 401 here just means "not logged in" — not a real error — so we catch it
// and resolve to null instead of letting useQuery land in an error state.
const fetchCurrentUser = async () => {
    try {
        const { user } = await authApiService.getMe();
        return user;
    } catch (error) {
        if (error.response?.status === 401) {
            return null;
        }
        throw error; // genuine failures (network/500) should still surface
    }
};

// Call this anywhere you need to know who's logged in — React Query dedupes
// and caches by key, so multiple components calling this only trigger one
// network request.
export const useCurrentUser = () =>
    useQuery({
        queryKey: ['auth', 'me'],
        queryFn: fetchCurrentUser,
        staleTime: 1000 * 60 * 5, // 5 min — session status doesn't need constant refetching
        retry: false,
    });

export const useLogin = () => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ username, password }) => authApiService.login({ username, password }),
        onSuccess: (data) => {
            console.log(data)
            dispatch(setUserInfo(data.data.user))
            return queryClient.setQueryData(['auth', 'me'], data.data.user);
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authApiService.logout,
        onSuccess: () => {
            queryClient.setQueryData(['auth', 'me'], null);
            // Wipe everything else too — otherwise the next person on a shared
            // terminal could briefly see the previous user's cached products/invoices.
            queryClient.clear();
        },
    });
};