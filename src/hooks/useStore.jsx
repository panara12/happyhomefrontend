import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import storeApiService from "../apiServices/storeApi";

export function useGetAllStores() {
    return useQuery({
        queryKey: ['stores'],
        queryFn: storeApiService.getAllStores,
    });
}

 
export function useAddStore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: storeApiService.addStore,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] }),
    });
}
 
export function useUpdateStore() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: storeApiService.updateStore,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] }),
    });
}