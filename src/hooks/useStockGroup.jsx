import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import stockGroupApiService from "../apiServices/useStockGroupApi";

export function useGetAllStockGroup() {
    return useQuery({
        queryKey: ['stockGroup'],
        queryFn: ()=>stockGroupApiService.getAllStockGroup(),
    });
}