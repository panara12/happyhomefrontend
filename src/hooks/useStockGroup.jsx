import { useApiQuery } from "./useApiQuery";

export function useGetAllStockGroup() {
    return useApiQuery({
        queryKey: ["stockGroup"],
        path: "/stockgroup/getallstockgroup",
    });
}
