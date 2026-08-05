import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import userApiService from "../apiServices/userApi";

export function useGetAllUsers(){
    return useQuery({
        queryKey:['getAllUsers'],
        queryFn: ()=> userApiService.getAllUsers(),
    })
}

export function useGetAllUsersStoreWise(payload){
    const {data, isLoading, isError, error} = useQuery('getAllUsersStoreWise', () => userApiService.getAllUsersStoreWise(payload));
    console.log(data);
    return {data, isLoading, isError, error};
}

export function addUser(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: userApiService.addUser,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['getAllUsers'] }),
    });
}

export function updateUser(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: userApiService.updateUser,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['getAllUsers'] }),
    });
}

export function deleteUser(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: userApiService.deleteUser,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['getAllUsers'] }),
    })
}
